export enum GameStatus {
  INTRO = 'INTRO',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  WIN = 'WIN',
}

export interface Player {
  x: number
  y: number
  width: number
  height: number
  speed: number
  movingLeft: boolean
  movingRight: boolean
  shootCooldown: number
  shooting: boolean
}

export interface Bullet {
  x: number
  y: number
  width: number
  height: number
  speed: number
  fromPlayer: boolean
}

export interface Alien {
  x: number
  y: number
  width: number
  height: number
  type: number
  alive: boolean
  animFrame: number
}

export interface Explosion {
  x: number
  y: number
  timer: number
  maxTimer: number
}

export interface Star {
  x: number
  y: number
  size: number
  brightness: number
  twinkleSpeed: number
  twinkleOffset: number
}

export interface GameState {
  status: GameStatus
  player: Player
  bullets: Bullet[]
  aliens: Alien[]
  explosions: Explosion[]
  stars: Star[]
  score: number
  highScore: number
  lives: number
  level: number
  alienDirection: number
  alienMoveTimer: number
  alienMoveInterval: number
  alienDescendNext: boolean
  alienShootTimer: number
  alienShootInterval: number
  alienAnimTimer: number
  totalAliens: number
  canvasWidth: number
  canvasHeight: number
  flashTimer: number
  levelTransitionTimer: number
}

const CANVAS_W = 800
const CANVAS_H = 600
const ALIEN_COLS = 11
const ALIEN_ROWS = 5
const ALIEN_W = 36
const ALIEN_H = 28
const ALIEN_H_GAP = 16
const ALIEN_V_GAP = 12

function createStars(): Star[] {
  const stars: Star[] = []
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      size: Math.random() * 2 + 0.5,
      brightness: Math.random(),
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
    })
  }
  return stars
}

function createAliens(level: number): Alien[] {
  const aliens: Alien[] = []
  const startX = (CANVAS_W - ALIEN_COLS * (ALIEN_W + ALIEN_H_GAP)) / 2
  const startY = 80
  for (let row = 0; row < ALIEN_ROWS; row++) {
    for (let col = 0; col < ALIEN_COLS; col++) {
      const type = row === 0 ? 2 : row <= 2 ? 1 : 0
      aliens.push({
        x: startX + col * (ALIEN_W + ALIEN_H_GAP),
        y: startY + row * (ALIEN_H + ALIEN_V_GAP),
        width: ALIEN_W,
        height: ALIEN_H,
        type,
        alive: true,
        animFrame: 0,
      })
    }
  }
  return aliens
}

export function createInitialState(): GameState {
  return {
    status: GameStatus.INTRO,
    player: {
      x: CANVAS_W / 2 - 24,
      y: CANVAS_H - 60,
      width: 48,
      height: 32,
      speed: 5,
      movingLeft: false,
      movingRight: false,
      shootCooldown: 0,
      shooting: false,
    },
    bullets: [],
    aliens: createAliens(1),
    explosions: [],
    stars: createStars(),
    score: 0,
    highScore: 0,
    lives: 3,
    level: 1,
    alienDirection: 1,
    alienMoveTimer: 0,
    alienMoveInterval: 800,
    alienDescendNext: false,
    alienShootTimer: 0,
    alienShootInterval: 1500,
    alienAnimTimer: 0,
    totalAliens: ALIEN_COLS * ALIEN_ROWS,
    canvasWidth: CANVAS_W,
    canvasHeight: CANVAS_H,
    flashTimer: 0,
    levelTransitionTimer: 0,
  }
}

export function handleKeyDown(state: GameState, code: string): GameState {
  if (
    state.status === GameStatus.INTRO ||
    state.status === GameStatus.GAME_OVER ||
    state.status === GameStatus.WIN
  ) {
    if (code === 'Enter' || code === 'Space') {
      const newState = createInitialState()
      return {
        ...newState,
        status: GameStatus.PLAYING,
        highScore: state.highScore,
      }
    }
  }
  if (state.status === GameStatus.PLAYING) {
    let updated = { ...state }
    if (code === 'ArrowLeft' || code === 'KeyA')
      updated = { ...updated, player: { ...updated.player, movingLeft: true } }
    if (code === 'ArrowRight' || code === 'KeyD')
      updated = { ...updated, player: { ...updated.player, movingRight: true } }
    if (code === 'Space') updated = { ...updated, player: { ...updated.player, shooting: true } }
    return updated
  }
  return state
}

export function handleKeyUp(state: GameState, code: string): GameState {
  if (state.status !== GameStatus.PLAYING) return state
  let updated = { ...state }
  if (code === 'ArrowLeft' || code === 'KeyA')
    updated = { ...updated, player: { ...updated.player, movingLeft: false } }
  if (code === 'ArrowRight' || code === 'KeyD')
    updated = { ...updated, player: { ...updated.player, movingRight: false } }
  if (code === 'Space') updated = { ...updated, player: { ...updated.player, shooting: false } }
  return updated
}

export function updateGame(state: GameState, delta: number, keys: Set<string>): GameState {
  let s = { ...state }

  if (s.levelTransitionTimer > 0) {
    s.levelTransitionTimer -= delta
    return s
  }

  // Update stars twinkle (no movement needed, handled in render)
  // Move player
  const movingLeft = s.player.movingLeft || keys.has('ArrowLeft') || keys.has('KeyA')
  const movingRight = s.player.movingRight || keys.has('ArrowRight') || keys.has('KeyD')
  const shooting = s.player.shooting || keys.has('Space')

  let px = s.player.x
  if (movingLeft) px = Math.max(0, px - s.player.speed)
  if (movingRight) px = Math.min(s.canvasWidth - s.player.width, px + s.player.speed)
  s.player = { ...s.player, x: px }

  // Player shoot
  let shootCooldown = s.player.shootCooldown - delta
  if (shootCooldown < 0) shootCooldown = 0
  if (shooting && shootCooldown <= 0) {
    s.bullets = [
      ...s.bullets,
      {
        x: s.player.x + s.player.width / 2 - 2,
        y: s.player.y - 8,
        width: 4,
        height: 16,
        speed: 10,
        fromPlayer: true,
      },
    ]
    shootCooldown = 400
  }
  s.player = { ...s.player, shootCooldown }

  // Alien animation timer
  s.alienAnimTimer += delta
  const alienAnimFrame = s.alienAnimTimer > 500 ? 1 : 0
  if (s.alienAnimTimer > 1000) s.alienAnimTimer = 0

  // Move aliens
  s.alienMoveTimer += delta
  let alienDescendNext = s.alienDescendNext
  let alienDirection = s.alienDirection
  let aliens = s.aliens.map((a) => ({ ...a, animFrame: alienAnimFrame }))

  const aliveAliens = aliens.filter((a) => a.alive)
  const aliveCount = aliveAliens.length
  const speedFactor = 1 + ((s.totalAliens - aliveCount) / s.totalAliens) * 2
  const currentInterval = Math.max(80, s.alienMoveInterval / speedFactor)

  if (s.alienMoveTimer >= currentInterval) {
    s.alienMoveTimer = 0
    const step = 8

    if (alienDescendNext) {
      aliens = aliens.map((a) => ({ ...a, y: a.y + 20 }))
      alienDescendNext = false
    } else {
      const leftmost = aliveAliens.reduce((m, a) => Math.min(m, a.x), Infinity)
      const rightmost = aliveAliens.reduce((m, a) => Math.max(m, a.x + a.width), -Infinity)

      if (alienDirection === 1 && rightmost + step > s.canvasWidth - 10) {
        alienDirection = -1
        alienDescendNext = true
      } else if (alienDirection === -1 && leftmost - step < 10) {
        alienDirection = 1
        alienDescendNext = true
      } else {
        aliens = aliens.map((a) => ({ ...a, x: a.x + step * alienDirection }))
      }
    }
  }

  s.aliens = aliens
  s.alienDirection = alienDirection
  s.alienDescendNext = alienDescendNext

  // Alien shoot
  s.alienShootTimer += delta
  if (s.alienShootTimer >= s.alienShootInterval) {
    s.alienShootTimer = 0
    const shooters = aliveAliens
    if (shooters.length > 0) {
      const shooter = shooters[Math.floor(Math.random() * shooters.length)]
      s.bullets = [
        ...s.bullets,
        {
          x: shooter.x + shooter.width / 2 - 2,
          y: shooter.y + shooter.height,
          width: 4,
          height: 16,
          speed: 4 + s.level * 0.5,
          fromPlayer: false,
        },
      ]
    }
  }

  // Move bullets
  s.bullets = s.bullets
    .map((b) => ({
      ...b,
      y: b.fromPlayer ? b.y - b.speed : b.y + b.speed,
    }))
    .filter((b) => b.y > -b.height && b.y < s.canvasHeight + b.height)

  // Bullet-alien collision
  const playerBullets = s.bullets.filter((b) => b.fromPlayer)
  const enemyBullets = s.bullets.filter((b) => !b.fromPlayer)
  let newScore = s.score
  const hitBulletIndices = new Set<number>()

  let updatedAliens = s.aliens.map((alien) => {
    if (!alien.alive) return alien
    for (let i = 0; i < playerBullets.length; i++) {
      const b = playerBullets[i]
      if (
        b.x < alien.x + alien.width &&
        b.x + b.width > alien.x &&
        b.y < alien.y + alien.height &&
        b.y + b.height > alien.y
      ) {
        hitBulletIndices.add(s.bullets.indexOf(b))
        const points = alien.type === 2 ? 30 : alien.type === 1 ? 20 : 10
        newScore += points
        s.explosions = [
          ...s.explosions,
          { x: alien.x + alien.width / 2, y: alien.y + alien.height / 2, timer: 0, maxTimer: 600 },
        ]
        return { ...alien, alive: false }
      }
    }
    return alien
  })

  s.bullets = s.bullets.filter((_, i) => !hitBulletIndices.has(i))
  s.aliens = updatedAliens
  s.score = newScore

  // Bullet-player collision
  let lives = s.lives
  const remainingEnemyBullets: Bullet[] = []
  let playerHit = false
  for (const b of enemyBullets) {
    const p = s.player
    if (
      !playerHit &&
      b.x < p.x + p.width &&
      b.x + b.width > p.x &&
      b.y < p.y + p.height &&
      b.y + b.height > p.y
    ) {
      lives--
      playerHit = true
      s.explosions = [
        ...s.explosions,
        { x: p.x + p.width / 2, y: p.y + p.height / 2, timer: 0, maxTimer: 800 },
      ]
      s.flashTimer = 300
    } else {
      remainingEnemyBullets.push(b)
    }
  }
  s.bullets = [...s.bullets.filter((b) => b.fromPlayer), ...remainingEnemyBullets]
  s.lives = lives

  if (s.flashTimer > 0) s.flashTimer -= delta

  // Update explosions
  s.explosions = s.explosions
    .map((e) => ({ ...e, timer: e.timer + delta }))
    .filter((e) => e.timer < e.maxTimer)

  // Check aliens reached bottom
  const reachedBottom = s.aliens.some((a) => a.alive && a.y + a.height >= s.player.y)
  if (reachedBottom) {
    lives = 0
    s.lives = 0
  }

  // Check game over
  const highScore = Math.max(s.highScore, s.score)
  if (s.lives <= 0) {
    return { ...s, status: GameStatus.GAME_OVER, highScore }
  }

  // Check win
  const allDead = s.aliens.every((a) => !a.alive)
  if (allDead) {
    const nextLevel = s.level + 1
    const newInterval = Math.max(200, 800 - (nextLevel - 1) * 80)
    const newShootInterval = Math.max(500, 1500 - (nextLevel - 1) * 150)
    return {
      ...s,
      status: GameStatus.PLAYING,
      level: nextLevel,
      aliens: createAliens(nextLevel),
      bullets: [],
      alienMoveInterval: newInterval,
      alienShootInterval: newShootInterval,
      alienDirection: 1,
      alienDescendNext: false,
      alienMoveTimer: 0,
      alienShootTimer: 0,
      totalAliens: ALIEN_COLS * ALIEN_ROWS,
      highScore,
      levelTransitionTimer: 2000,
      flashTimer: 0,
    }
  }

  return { ...s, highScore }
}

// ---- RENDER ----

const ALIEN_COLORS = ['#33ff33', '#00ffff', '#ff33ff']
const ALIEN_SCORE = [10, 20, 30]

function drawPixelShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color
  // Simple pixel ship shape
  const grid = [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 0, 1, 1, 0, 1, 0],
  ]
  const pw = w / grid[0].length
  const ph = h / grid.length
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c]) {
        ctx.fillRect(x + c * pw, y + r * ph, pw - 1, ph - 1)
      }
    }
  }
}

function drawAlienType0(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  frame: number,
  color: string,
) {
  ctx.fillStyle = color
  const grids = [
    [
      [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
    ],
    [
      [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
      [1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 1, 1, 0, 1, 1, 0, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0, 0, 1, 1, 1, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    ],
  ]
  const grid = grids[frame % 2]
  const pw = w / grid[0].length
  const ph = h / grid.length
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c]) ctx.fillRect(x + c * pw, y + r * ph, pw - 1, ph - 1)
    }
  }
}

function drawAlienType1(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  frame: number,
  color: string,
) {
  ctx.fillStyle = color
  const grids = [
    [
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 0, 1, 1, 0, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 1, 1, 0, 1, 1, 0, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    ],
  ]
  const grid = grids[frame % 2]
  const pw = w / grid[0].length
  const ph = h / grid.length
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c]) ctx.fillRect(x + c * pw, y + r * ph, pw - 1, ph - 1)
    }
  }
}

function drawAlienType2(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  frame: number,
  color: string,
) {
  ctx.fillStyle = color
  const grids = [
    [
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
      [0, 1, 1, 0, 1, 1, 0, 1, 1, 0],
      [1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
    ],
    [
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
      [0, 1, 0, 1, 1, 1, 1, 0, 1, 0],
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    ],
  ]
  const grid = grids[frame % 2]
  const pw = w / grid[0].length
  const ph = h / grid.length
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c]) ctx.fillRect(x + c * pw, y + r * ph, pw - 1, ph - 1)
    }
  }
}

function drawExplosion(ctx: CanvasRenderingContext2D, exp: Explosion, time: number) {
  const progress = exp.timer / exp.maxTimer
  const alpha = 1 - progress
  const size = 20 + progress * 30
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = '#ffff00'
  ctx.lineWidth = 2
  // Draw star burst
  const rays = 8
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2 + time * 0.01
    const innerR = size * 0.2
    const outerR = size
    ctx.beginPath()
    ctx.moveTo(exp.x + Math.cos(angle) * innerR, exp.y + Math.sin(angle) * innerR)
    ctx.lineTo(exp.x + Math.cos(angle) * outerR, exp.y + Math.sin(angle) * outerR)
    ctx.stroke()
  }
  ctx.restore()
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'center',
) {
  ctx.font = `${size}px 'Press Start 2P', monospace`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}

function drawGlowText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  ctx.save()
  ctx.font = `${size}px 'Press Start 2P', monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = color
  ctx.shadowBlur = 15
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
  ctx.restore()
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState) {
  const { canvasWidth: W, canvasHeight: H } = state

  // Background
  ctx.fillStyle = '#000011'
  ctx.fillRect(0, 0, W, H)

  // Stars
  const now = performance.now()
  for (const star of state.stars) {
    const flicker = 0.5 + 0.5 * Math.sin(now * star.twinkleSpeed + star.twinkleOffset)
    ctx.globalAlpha = 0.3 + flicker * 0.7
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(star.x, star.y, star.size, star.size)
  }
  ctx.globalAlpha = 1

  if (state.status === GameStatus.INTRO) {
    renderIntro(ctx, state, W, H)
    return
  }

  if (state.status === GameStatus.GAME_OVER) {
    renderGameOver(ctx, state, W, H)
    return
  }

  // HUD
  ctx.fillStyle = '#33ff33'
  ctx.fillRect(0, 50, W, 2)
  ctx.fillRect(0, H - 50, W, 2)

  drawText(ctx, `SCORE: ${state.score}`, 10, 25, 12, '#33ff33', 'left')
  drawText(ctx, `HI: ${state.highScore}`, W / 2, 25, 12, '#ffff00')
  drawText(ctx, `LEVEL: ${state.level}`, W - 10, 25, 12, '#33ff33', 'right')

  // Lives
  const lifeY = H - 28
  drawText(ctx, 'LIVES:', 10, lifeY, 10, '#33ff33', 'left')
  for (let i = 0; i < state.lives; i++) {
    drawPixelShip(ctx, 80 + i * 36, lifeY - 10, 28, 18, '#33ff33')
  }

  // Level transition overlay
  if (state.levelTransitionTimer > 0) {
    ctx.save()
    ctx.globalAlpha = 0.85
    ctx.fillStyle = '#000011'
    ctx.fillRect(0, 0, W, H)
    ctx.globalAlpha = 1
    drawGlowText(ctx, `LEVEL ${state.level}`, W / 2, H / 2 - 20, 28, '#33ff33')
    drawGlowText(ctx, 'GET READY!', W / 2, H / 2 + 30, 16, '#ffff00')
    ctx.restore()
    return
  }

  // Draw aliens
  for (const alien of state.aliens) {
    if (!alien.alive) continue
    const color = ALIEN_COLORS[alien.type]
    if (alien.type === 0)
      drawAlienType0(ctx, alien.x, alien.y, alien.width, alien.height, alien.animFrame, color)
    else if (alien.type === 1)
      drawAlienType1(ctx, alien.x, alien.y, alien.width, alien.height, alien.animFrame, color)
    else drawAlienType2(ctx, alien.x, alien.y, alien.width, alien.height, alien.animFrame, color)
  }

  // Draw player (flash on hit)
  if (state.flashTimer <= 0 || Math.floor(now / 80) % 2 === 0) {
    drawPixelShip(
      ctx,
      state.player.x,
      state.player.y,
      state.player.width,
      state.player.height,
      '#33ff33',
    )
    // Engine glow
    ctx.save()
    ctx.globalAlpha = 0.6
    ctx.fillStyle = '#ff6600'
    const thrusterFlicker = 0.5 + 0.5 * Math.sin(now * 0.05)
    ctx.fillRect(
      state.player.x + state.player.width / 2 - 4,
      state.player.y + state.player.height - 2,
      8,
      6 + thrusterFlicker * 6,
    )
    ctx.restore()
  }

  // Draw bullets
  for (const b of state.bullets) {
    if (b.fromPlayer) {
      ctx.save()
      ctx.shadowColor = '#33ff33'
      ctx.shadowBlur = 8
      ctx.fillStyle = '#33ff33'
      ctx.fillRect(b.x, b.y, b.width, b.height)
      ctx.restore()
    } else {
      ctx.save()
      ctx.shadowColor = '#ff3333'
      ctx.shadowBlur = 8
      ctx.fillStyle = '#ff3333'
      // Draw a zigzag bullet
      const seg = 4
      const zigzag = Math.floor(b.y / seg) % 2 === 0 ? 2 : -2
      ctx.fillRect(b.x + zigzag, b.y, b.width, seg)
      ctx.fillRect(b.x - zigzag, b.y + seg, b.width, seg)
      ctx.fillRect(b.x + zigzag, b.y + seg * 2, b.width, seg)
      ctx.fillRect(b.x - zigzag, b.y + seg * 3, b.width, seg)
      ctx.restore()
    }
  }

  // Draw explosions
  for (const exp of state.explosions) {
    drawExplosion(ctx, exp, now)
  }
}

function renderIntro(ctx: CanvasRenderingContext2D, state: GameState, W: number, H: number) {
  const now = performance.now()

  drawGlowText(ctx, 'SPACE INVADERS', W / 2, 130, 22, '#33ff33')

  // Draw sample aliens
  const sampleY = 200
  drawAlienType2(ctx, W / 2 - 18, sampleY, 36, 28, 0, '#ff33ff')
  drawText(ctx, '= 30 PTS', W / 2 + 30, sampleY + 14, 10, '#ff33ff', 'left')

  drawAlienType1(ctx, W / 2 - 18, sampleY + 50, 36, 28, 0, '#00ffff')
  drawText(ctx, '= 20 PTS', W / 2 + 30, sampleY + 64, 10, '#00ffff', 'left')

  drawAlienType0(ctx, W / 2 - 18, sampleY + 100, 36, 28, 0, '#33ff33')
  drawText(ctx, '= 10 PTS', W / 2 + 30, sampleY + 114, 10, '#33ff33', 'left')

  const blink = Math.floor(now / 600) % 2 === 0
  if (blink) {
    drawGlowText(ctx, 'PRESS ENTER TO START', W / 2, H - 120, 14, '#ffff00')
  }

  drawText(ctx, 'CONTROLS: ARROWS / WASD + SPACE', W / 2, H - 70, 9, '#888888')

  if (state.highScore > 0) {
    drawText(ctx, `HIGH SCORE: ${state.highScore}`, W / 2, H - 40, 10, '#ffff00')
  }
}

function renderGameOver(ctx: CanvasRenderingContext2D, state: GameState, W: number, H: number) {
  const now = performance.now()

  drawGlowText(ctx, 'GAME OVER', W / 2, H / 2 - 80, 28, '#ff3333')
  drawText(ctx, `SCORE: ${state.score}`, W / 2, H / 2 - 20, 16, '#ffffff')
  drawText(ctx, `HIGH SCORE: ${state.highScore}`, W / 2, H / 2 + 20, 14, '#ffff00')
  drawText(ctx, `LEVEL REACHED: ${state.level}`, W / 2, H / 2 + 55, 12, '#888888')

  const blink = Math.floor(now / 600) % 2 === 0
  if (blink) {
    drawGlowText(ctx, 'PRESS ENTER TO RETRY', W / 2, H / 2 + 110, 13, '#33ff33')
  }
}

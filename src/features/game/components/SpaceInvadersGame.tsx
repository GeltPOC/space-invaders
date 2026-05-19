'use client'

import { useEffect, useRef, useState } from 'react'
import { useGameLoop } from '../hooks/useGameLoop'
import { GameState, createInitialState } from '../domain/gameState'

export default function SpaceInvadersGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>(() => createInitialState())
  const gameStateRef = useRef<GameState>(gameState)

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  useGameLoop(canvasRef, gameStateRef, setGameState)

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="crt-effect"
        style={{ border: '2px solid #33ff33', boxShadow: '0 0 20px #33ff33, 0 0 40px #33ff3344' }}
      />
    </div>
  )
}

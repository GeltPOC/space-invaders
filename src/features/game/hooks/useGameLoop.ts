'use client'

import { useEffect, useRef, MutableRefObject, Dispatch, SetStateAction } from 'react'
import {
  GameState,
  GameStatus,
  updateGame,
  renderGame,
  handleKeyDown,
  handleKeyUp,
} from '../domain/gameState'

export function useGameLoop(
  canvasRef: MutableRefObject<HTMLCanvasElement | null>,
  gameStateRef: MutableRefObject<GameState>,
  setGameState: Dispatch<SetStateAction<GameState>>,
) {
  const animFrameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const keysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code)
      if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
        e.preventDefault()
      }
      const newState = handleKeyDown(gameStateRef.current, e.code)
      if (newState !== gameStateRef.current) {
        gameStateRef.current = newState
        setGameState(newState)
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code)
      const newState = handleKeyUp(gameStateRef.current, e.code)
      if (newState !== gameStateRef.current) {
        gameStateRef.current = newState
        setGameState(newState)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const loop = (timestamp: number) => {
      const delta = Math.min(timestamp - lastTimeRef.current, 50)
      lastTimeRef.current = timestamp

      const currentState = gameStateRef.current
      if (currentState.status === GameStatus.PLAYING) {
        const newState = updateGame(currentState, delta, keysRef.current)
        gameStateRef.current = newState
        setGameState(newState)
      }

      renderGame(ctx, gameStateRef.current)
      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])
}

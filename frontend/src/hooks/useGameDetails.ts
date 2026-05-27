import { useCallback, useEffect, useState } from 'react'
import { getGameDetails } from '../services/games'
import type { DetailsStatus, GameDetailResponse } from '../types/game'

interface DetailsState {
  resolvedKey: string | null  // "<gameId>:<fetchCount>" — changes on refetch
  status: Exclude<DetailsStatus, 'loading'>
  data: GameDetailResponse | null
}

const IDLE: DetailsState = { resolvedKey: null, status: 'idle', data: null }

export function useGameDetails(gameId: string | undefined) {
  const [state, setState] = useState<DetailsState>(IDLE)
  const [fetchCount, setFetchCount] = useState(0)

  const currentKey = gameId ? `${gameId}:${fetchCount}` : null

  useEffect(() => {
    if (!gameId) return

    const controller = new AbortController()

    getGameDetails(gameId, controller.signal)
      .then((data) => {
        setState({ resolvedKey: currentKey, status: 'success', data })
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const status = err instanceof Response && err.status === 404 ? 'not-found' : 'error'
        setState({ resolvedKey: currentKey, status, data: null })
      })

    return () => controller.abort()
  }, [gameId, fetchCount]) // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => {
    setFetchCount((c) => c + 1)
  }, [])

  // Derive loading: gameId exists but we haven't resolved this key yet
  if (currentKey && state.resolvedKey !== currentKey) {
    return { status: 'loading' as const, data: null, refetch }
  }

  if (!gameId) {
    return { status: 'idle' as const, data: null, refetch }
  }

  return { status: state.status, data: state.data, refetch }
}

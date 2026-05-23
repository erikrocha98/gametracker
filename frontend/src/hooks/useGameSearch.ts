import { useEffect, useState } from 'react'
import { searchGames } from '../services/games'
import type { GameSearchResult, SearchStatus } from '../types/game'

interface SearchState {
  status: SearchStatus
  results: GameSearchResult[]
  resolvedQuery: string | null
}

const IDLE: SearchState = { status: 'idle', results: [], resolvedQuery: null }
const LOADING: Pick<SearchState, 'status' | 'results'> = { status: 'loading', results: [] }

export function useGameSearch(query: string): Pick<SearchState, 'status' | 'results'> {
  const [state, setState] = useState<SearchState>(IDLE)

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) return

    const controller = new AbortController()

    searchGames(trimmed, controller.signal)
      .then((data) => {
        setState(
          data.results.length > 0
            ? { status: 'success', results: data.results, resolvedQuery: trimmed }
            : { status: 'empty', results: [], resolvedQuery: trimmed },
        )
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setState({ status: 'error', results: [], resolvedQuery: trimmed })
      })

    return () => controller.abort()
  }, [query])

  const trimmed = query.trim()
  if (!trimmed) return IDLE
  if (state.resolvedQuery !== trimmed) return LOADING
  return state
}

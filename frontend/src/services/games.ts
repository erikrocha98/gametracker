import type { CollectionResponse, GameDetailResponse, GameSearchResponse } from '../types/game'
import { http } from './http'

export function searchGames(q: string, signal?: AbortSignal): Promise<GameSearchResponse> {
  return http.get<GameSearchResponse>(`/games/search?q=${encodeURIComponent(q)}`, { signal })
}

export function getCollection(): Promise<CollectionResponse> {
  return http.get<CollectionResponse>('/games/collection')
}

export function getGameDetails(gameId: string, signal?: AbortSignal): Promise<GameDetailResponse> {
  return http.get<GameDetailResponse>(`/games/${encodeURIComponent(gameId)}`, { signal })
}

export function addToWantToPlay(gameId: string): Promise<void> {
  return http.post<void>('/games/want-to-play', { gameId })
}

export function removeFromWantToPlay(gameId: string): Promise<void> {
  return http.delete<void>(`/games/want-to-play/${encodeURIComponent(gameId)}`)
}

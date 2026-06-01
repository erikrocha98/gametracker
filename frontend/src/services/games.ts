import type { CollectionGame, CollectionResponse, GameDetailResponse, GameSearchResponse } from '../types/game'
import { http } from './http'

export type CollectionStatus = 'want_to_play' | 'finished'

export function searchGames(q: string, signal?: AbortSignal): Promise<GameSearchResponse> {
  return http.get<GameSearchResponse>(`/games/search?q=${encodeURIComponent(q)}`, { signal })
}

export function getCollection(status?: CollectionStatus): Promise<CollectionResponse> {
  const query = status ? `?status=${status}` : ''
  return http.get<CollectionResponse>(`/games/collection${query}`)
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

export function rateGame(gameId: string, rating: number): Promise<CollectionGame> {
  return http.put<CollectionGame>(`/games/${encodeURIComponent(gameId)}/rating`, { rating })
}

export function removeRating(gameId: string): Promise<void> {
  return http.delete<void>(`/games/${encodeURIComponent(gameId)}/rating`)
}

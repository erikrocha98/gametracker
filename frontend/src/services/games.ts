import type { CollectionResponse, GameSearchResponse } from '../types/game'
import { http } from './http'

export function searchGames(q: string, signal?: AbortSignal): Promise<GameSearchResponse> {
  return http.get<GameSearchResponse>(`/games/search?q=${encodeURIComponent(q)}`, { signal })
}

export function getCollection(): Promise<CollectionResponse> {
  return http.get<CollectionResponse>('/games/collection')
}

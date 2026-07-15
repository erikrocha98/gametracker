import type { GameList, GameListDetail, GameListsResponse, ListGame } from '../types/list'
import { http } from './http'

export function getLists(gameId?: string): Promise<GameListsResponse> {
  const url = gameId ? `/lists?gameId=${encodeURIComponent(gameId)}` : '/lists'
  return http.get<GameListsResponse>(url)
}

export function getList(id: number): Promise<GameListDetail> {
  return http.get<GameListDetail>(`/lists/${id}`)
}

export function addGameToList(listId: number, gameId: string): Promise<ListGame> {
  return http.post<ListGame>(`/lists/${listId}/games`, { gameId })
}

export function removeGameFromList(listId: number, gameId: string): Promise<void> {
  return http.delete<void>(`/lists/${listId}/games/${encodeURIComponent(gameId)}`)
}

export function createList(name: string, description: string | null): Promise<GameList> {
  return http.post<GameList>('/lists', { name, description })
}

export function updateList(id: number, name: string, description: string | null): Promise<GameList> {
  return http.put<GameList>(`/lists/${id}`, { name, description })
}

export function deleteList(id: number): Promise<void> {
  return http.delete<void>(`/lists/${id}`)
}

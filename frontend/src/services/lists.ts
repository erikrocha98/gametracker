import type { GameList, GameListsResponse } from '../types/list'
import { http } from './http'

export function getLists(): Promise<GameListsResponse> {
  return http.get<GameListsResponse>('/lists')
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

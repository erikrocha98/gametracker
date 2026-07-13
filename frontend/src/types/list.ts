export interface GameList {
  id: number
  name: string
  description: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface GameListsResponse {
  items: GameList[]
}

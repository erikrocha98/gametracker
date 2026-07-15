export interface GameList {
  id: number
  name: string
  description: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
  gameCount: number
  coverUrls: string[]
  containsGame?: boolean | null
}

export interface GameListsResponse {
  items: GameList[]
}

export interface ListGame {
  gameId: string
  name: string
  coverUrl: string | null
  platforms: string[]
  releaseYear: number | null
  addedAt: string
}

export interface GameListDetail extends GameList {
  items: ListGame[]
}

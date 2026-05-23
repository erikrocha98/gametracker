export interface GameSearchResult {
  id: string
  name: string
  coverUrl: string | null
  platforms: string[]
  releaseYear: number | null
}

export interface GameSearchResponse {
  results: GameSearchResult[]
}

export interface CollectionGame {
  id: number
  gameId: string
  name: string
  coverUrl: string | null
  platforms: string[]
  releaseYear: number | null
}

export interface CollectionResponse {
  items: CollectionGame[]
}

export type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error'

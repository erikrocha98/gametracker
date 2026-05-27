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

export interface GameDetailResponse {
  id: string
  name: string
  description: string | null
  releaseDate: string | null
  coverUrl: string | null
  genres: string[]
  platforms: string[]
  developers: string[]
  platformAverageRating: number | null
  rawgRating: number | null
  screenshots: string[]
}

export type DetailsStatus = 'idle' | 'loading' | 'success' | 'not-found' | 'error'

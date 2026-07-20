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

export type GameStatus = 'want_to_play' | 'playing' | 'finished'

export interface CollectionGame {
  id: number
  gameId: string
  name: string
  coverUrl: string | null
  platforms: string[]
  releaseYear: number | null
  rating: number | null
  status: GameStatus
}

export interface CollectionResponse {
  items: CollectionGame[]
}

export interface StatusCounts {
  wantToPlay: number
  playing: number
  finished: number
}

export interface CollectionStats {
  gamesRated: number
  averageRating: number | null
  statusCounts: StatusCounts
  recentGames: CollectionGame[]
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
  userRating: number | null
  userReview: string | null
  userReviewCreatedAt: string | null
}

export type DetailsStatus = 'idle' | 'loading' | 'success' | 'not-found' | 'error'

export interface UserReview {
  gameId: string
  name: string
  coverUrl: string | null
  platforms: string[]
  releaseYear: number | null
  rating: number | null
  review: string
  reviewCreatedAt: string | null
}

export interface UserReviewsResponse {
  items: UserReview[]
}

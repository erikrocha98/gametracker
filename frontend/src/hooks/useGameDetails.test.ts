import { renderHook, waitFor } from '@testing-library/react'
import { useGameDetails } from './useGameDetails'
import * as gamesService from '../services/games'
import type { GameDetailResponse } from '../types/game'

vi.mock('../services/games')

const mockGetGameDetails = vi.mocked(gamesService.getGameDetails)

const GAME: GameDetailResponse = {
  id: 'rawg-3498',
  name: 'Grand Theft Auto V',
  description: 'An open world action game.',
  releaseDate: '2013-09-17',
  coverUrl: 'https://example.com/cover.jpg',
  genres: ['Action', 'Open World'],
  platforms: ['PC', 'PlayStation 5'],
  developers: ['Rockstar Games'],
  platformAverageRating: null,
  rawgRating: 4.5,
  screenshots: ['https://example.com/ss1.jpg'],
  userRating: null,
}

afterEach(() => vi.clearAllMocks())

test('returns loading initially when gameId is provided', () => {
  mockGetGameDetails.mockResolvedValue(GAME)
  const { result } = renderHook(() => useGameDetails('rawg-3498'))
  expect(result.current.status).toBe('loading')
  expect(result.current.data).toBeNull()
})

test('returns success with data on happy path', async () => {
  mockGetGameDetails.mockResolvedValue(GAME)
  const { result } = renderHook(() => useGameDetails('rawg-3498'))
  await waitFor(() => expect(result.current.status).toBe('success'))
  expect(result.current.data).toEqual(GAME)
})

test('returns not-found when API responds with 404', async () => {
  const notFound = new Response(null, { status: 404 })
  mockGetGameDetails.mockRejectedValue(notFound)
  const { result } = renderHook(() => useGameDetails('rawg-999'))
  await waitFor(() => expect(result.current.status).toBe('not-found'))
  expect(result.current.data).toBeNull()
})

test('returns error on generic failure', async () => {
  mockGetGameDetails.mockRejectedValue(new Error('network error'))
  const { result } = renderHook(() => useGameDetails('rawg-3498'))
  await waitFor(() => expect(result.current.status).toBe('error'))
})

test('returns idle when gameId is undefined', () => {
  const { result } = renderHook(() => useGameDetails(undefined))
  expect(result.current.status).toBe('idle')
})

test('does not update state on abort', async () => {
  const abortError = new DOMException('Aborted', 'AbortError')
  mockGetGameDetails.mockRejectedValue(abortError)
  const { result } = renderHook(() => useGameDetails('rawg-3498'))
  await waitFor(() => expect(result.current.status).toBe('loading'))
  // status stays loading (abort was ignored), no error thrown
  expect(result.current.data).toBeNull()
})

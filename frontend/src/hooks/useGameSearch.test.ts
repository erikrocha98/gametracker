import { renderHook, waitFor } from '@testing-library/react'
import { useGameSearch } from './useGameSearch'
import * as gamesService from '../services/games'

vi.mock('../services/games')

const mockSearch = vi.mocked(gamesService.searchGames)

const RESULTS = [
  { id: 'rawg-1', name: 'Zelda', coverUrl: null, platforms: [], releaseYear: 2017 },
]

afterEach(() => vi.clearAllMocks())

test('returns idle when query is empty', () => {
  const { result } = renderHook(() => useGameSearch(''))
  expect(result.current.status).toBe('idle')
  expect(result.current.results).toEqual([])
})

test('returns idle when query is blank', () => {
  const { result } = renderHook(() => useGameSearch('   '))
  expect(result.current.status).toBe('idle')
})

test('returns success with results when API responds', async () => {
  mockSearch.mockResolvedValue({ results: RESULTS })
  const { result } = renderHook(() => useGameSearch('zelda'))
  await waitFor(() => expect(result.current.status).toBe('success'))
  expect(result.current.results).toEqual(RESULTS)
})

test('returns empty when API returns no results', async () => {
  mockSearch.mockResolvedValue({ results: [] })
  const { result } = renderHook(() => useGameSearch('zzzzz'))
  await waitFor(() => expect(result.current.status).toBe('empty'))
  expect(result.current.results).toEqual([])
})

test('returns error when API rejects', async () => {
  mockSearch.mockRejectedValue(new Error('network error'))
  const { result } = renderHook(() => useGameSearch('gta'))
  await waitFor(() => expect(result.current.status).toBe('error'))
})

test('transitions to loading then success', async () => {
  mockSearch.mockResolvedValue({ results: RESULTS })
  const { result } = renderHook(() => useGameSearch('zelda'))
  expect(result.current.status).toBe('loading')
  await waitFor(() => expect(result.current.status).toBe('success'))
})

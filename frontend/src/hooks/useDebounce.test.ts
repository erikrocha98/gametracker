import { act, renderHook } from '@testing-library/react'
import { useDebounce } from './useDebounce'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

test('returns initial value immediately', () => {
  const { result } = renderHook(() => useDebounce('hello', 300))
  expect(result.current).toBe('hello')
})

test('does not update value before delay elapses', () => {
  const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
    initialProps: { value: 'a' },
  })
  rerender({ value: 'ab' })
  act(() => vi.advanceTimersByTime(200))
  expect(result.current).toBe('a')
})

test('updates value after delay elapses', () => {
  const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
    initialProps: { value: 'a' },
  })
  rerender({ value: 'ab' })
  act(() => vi.advanceTimersByTime(300))
  expect(result.current).toBe('ab')
})

test('resets timer on rapid updates', () => {
  const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
    initialProps: { value: 'a' },
  })
  rerender({ value: 'ab' })
  act(() => vi.advanceTimersByTime(200))
  rerender({ value: 'abc' })
  act(() => vi.advanceTimersByTime(200))
  expect(result.current).toBe('a')
  act(() => vi.advanceTimersByTime(100))
  expect(result.current).toBe('abc')
})

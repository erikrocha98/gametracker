import { render, screen } from '@testing-library/react'
import { GameCover } from './GameCover'

test('renders image when coverUrl is provided', () => {
  render(<GameCover coverUrl="https://example.com/cover.jpg" name="Zelda" />)
  const img = screen.getByRole('img', { name: 'Zelda' })
  expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg')
})

test('renders fallback icon when coverUrl is null', () => {
  render(<GameCover coverUrl={null} name="Zelda" />)
  expect(screen.queryByRole('img')).toBeNull()
})

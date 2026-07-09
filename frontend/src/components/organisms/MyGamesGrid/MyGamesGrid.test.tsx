import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { MyGamesGrid } from './MyGamesGrid'
import { texts } from '../../../constants/texts'
import type { CollectionGame } from '../../../types/game'

const items: CollectionGame[] = [
  { id: 1, gameId: 'zelda', name: 'Zelda', coverUrl: null, platforms: ['Switch'], releaseYear: 2017, rating: null, status: 'want_to_play' },
  { id: 2, gameId: 'mario', name: 'Mario', coverUrl: null, platforms: ['Switch'], releaseYear: 2017, rating: null, status: 'want_to_play' },
]

function renderGrid(props = {}) {
  const onRemove = vi.fn()
  const onRate = vi.fn()
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <MyGamesGrid items={items} loading={false} error={false} onRemove={onRemove} onRate={onRate} {...props} />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
  return { onRemove, onRate }
}

test('renders game cards', () => {
  renderGrid()
  expect(screen.getByText('Zelda')).toBeInTheDocument()
  expect(screen.getByText('Mario')).toBeInTheDocument()
})

test('renders loading state', () => {
  renderGrid({ loading: true })
  expect(screen.getByRole('progressbar')).toBeInTheDocument()
})

test('renders error message', () => {
  renderGrid({ loading: false, error: true })
  expect(screen.getByText(texts.myGames.loadError)).toBeInTheDocument()
})

test('renders empty state when no items', () => {
  renderGrid({ items: [] })
  expect(screen.getByText(texts.myGames.emptyTitle)).toBeInTheDocument()
})

test('calls onRemove when remove button is clicked', async () => {
  const { onRemove } = renderGrid()
  const removeButtons = screen.getAllByRole('button', { name: texts.myGames.removeAriaLabel })
  await userEvent.click(removeButtons[0])
  expect(onRemove).toHaveBeenCalledWith('zelda')
})

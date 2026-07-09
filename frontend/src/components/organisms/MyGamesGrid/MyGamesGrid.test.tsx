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
  const onStatusChange = vi.fn()
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <MyGamesGrid
            items={items}
            loading={false}
            error={false}
            onRemove={onRemove}
            onRate={onRate}
            onStatusChange={onStatusChange}
            {...props}
          />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
  return { onRemove, onRate, onStatusChange }
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

test('calls onRemove when the delete option is picked from a card menu', async () => {
  const { onRemove } = renderGrid()
  // a remoção mora dentro do menu do card: abrir o menu do primeiro card e clicar em "Deletar"
  const menuButtons = screen.getAllByRole('button', { name: texts.myGames.menuAriaLabel })
  await userEvent.click(menuButtons[0])
  await userEvent.click(await screen.findByRole('menuitem', { name: texts.myGames.menuDelete }))
  expect(onRemove).toHaveBeenCalledWith('zelda')
})

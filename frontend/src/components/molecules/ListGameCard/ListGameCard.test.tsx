import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { ListGameCard } from './ListGameCard'
import { texts } from '../../../constants/texts'
import type { ListGame } from '../../../types/list'

const GAME: ListGame = {
  gameId: 'rawg-3498',
  name: 'Grand Theft Auto V',
  coverUrl: 'https://example.com/cover.jpg',
  platforms: ['PlayStation 5', 'PC'],
  releaseYear: 2013,
  addedAt: '2026-07-13T00:00:00Z',
}

function renderCard(props: Partial<Parameters<typeof ListGameCard>[0]> = {}) {
  const onRemove = vi.fn()
  render(
    <MemoryRouter>
      <MuiThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <ListGameCard game={GAME} onRemove={onRemove} {...props} />
        </StyledThemeProvider>
      </MuiThemeProvider>
    </MemoryRouter>,
  )
  return { onRemove }
}

test('renders the game name', () => {
  renderCard()
  expect(screen.getByText('Grand Theft Auto V')).toBeInTheDocument()
})

test('links to the game details page', () => {
  renderCard()
  expect(screen.getByRole('link')).toHaveAttribute('href', '/games/rawg-3498')
})

test('renders the release year', () => {
  renderCard()
  expect(screen.getByText(/2013/)).toBeInTheDocument()
})

test('renders — when release year is null', () => {
  renderCard({ game: { ...GAME, releaseYear: null } })
  expect(screen.getByText(/—/)).toBeInTheDocument()
})

test('calls onRemove when the remove button is clicked', async () => {
  const user = userEvent.setup()
  const { onRemove } = renderCard()
  await user.click(screen.getByRole('button', { name: texts.myLists.removeGameAriaLabel }))
  expect(onRemove).toHaveBeenCalledOnce()
})

test('does not render the remove button without an onRemove handler', () => {
  renderCard({ onRemove: undefined })
  expect(
    screen.queryByRole('button', { name: texts.myLists.removeGameAriaLabel }),
  ).not.toBeInTheDocument()
})

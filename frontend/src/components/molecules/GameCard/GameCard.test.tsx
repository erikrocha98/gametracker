import { render, screen } from '@testing-library/react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { MemoryRouter } from 'react-router-dom'
import { theme } from '../../../theme/theme'
import { GameCard } from './GameCard'
import type { CollectionGame } from '../../../types/game'

const GAME: CollectionGame = {
  id: 1,
  gameId: 'rawg-3498',
  name: 'Grand Theft Auto V',
  coverUrl: 'https://example.com/cover.jpg',
  platforms: ['PlayStation 5', 'PC'],
  releaseYear: 2013,
}

function renderCard(game = GAME) {
  return render(
    <MemoryRouter>
      <MuiThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <GameCard game={game} />
        </StyledThemeProvider>
      </MuiThemeProvider>
    </MemoryRouter>,
  )
}

test('renders game name', () => {
  renderCard()
  expect(screen.getByText('Grand Theft Auto V')).toBeInTheDocument()
})

test('renders cover image', () => {
  renderCard()
  expect(screen.getByRole('img', { name: 'Grand Theft Auto V' })).toBeInTheDocument()
})

test('renders release year', () => {
  renderCard()
  expect(screen.getByText(/2013/)).toBeInTheDocument()
})

test('renders — when release year is null', () => {
  renderCard({ ...GAME, releaseYear: null })
  expect(screen.getByText(/—/)).toBeInTheDocument()
})

test('card is a link to /games/:gameId', () => {
  renderCard()
  expect(screen.getByRole('link')).toHaveAttribute('href', '/games/rawg-3498')
})

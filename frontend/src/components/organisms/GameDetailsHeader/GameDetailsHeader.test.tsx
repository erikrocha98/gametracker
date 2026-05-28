import { render, screen } from '@testing-library/react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { MemoryRouter } from 'react-router-dom'
import { theme } from '../../../theme/theme'
import { GameDetailsHeader } from './GameDetailsHeader'
import type { GameDetailResponse } from '../../../types/game'

const GAME: GameDetailResponse = {
  id: 'rawg-3498',
  name: 'Grand Theft Auto V',
  description: 'An open world game.',
  releaseDate: '2013-09-17',
  coverUrl: 'https://example.com/cover.jpg',
  genres: ['Action', 'Open World'],
  platforms: ['PC', 'PlayStation 5'],
  developers: ['Rockstar Games'],
  platformAverageRating: null,
  rawgRating: 4.5,
  screenshots: [],
}

function renderHeader(game = GAME) {
  return render(
    <MemoryRouter>
      <MuiThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <GameDetailsHeader game={game} onAddToWantToPlay={() => {}} addLoading={false} added={false} />
        </StyledThemeProvider>
      </MuiThemeProvider>
    </MemoryRouter>,
  )
}

test('renders game name as heading', () => {
  renderHeader()
  expect(screen.getByRole('heading', { name: 'Grand Theft Auto V' })).toBeInTheDocument()
})

test('renders cover image', () => {
  renderHeader()
  expect(screen.getByRole('img', { name: 'Grand Theft Auto V' })).toBeInTheDocument()
})

test('renders genre chips', () => {
  renderHeader()
  expect(screen.getByText('Action')).toBeInTheDocument()
  expect(screen.getByText('Open World')).toBeInTheDocument()
})

test('renders RAWG rating badge', () => {
  renderHeader()
  expect(screen.getByText('RAWG')).toBeInTheDocument()
  expect(screen.getByText('4.5')).toBeInTheDocument()
})

test('renders platform rating badge with "Em breve"', () => {
  renderHeader()
  expect(screen.getByText('Plataforma')).toBeInTheDocument()
  expect(screen.getByText('Em breve')).toBeInTheDocument()
})

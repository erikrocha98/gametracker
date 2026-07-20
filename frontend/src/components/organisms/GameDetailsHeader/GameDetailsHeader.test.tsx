import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { MemoryRouter } from 'react-router-dom'
import { theme } from '../../../theme/theme'
import { GameDetailsHeader } from './GameDetailsHeader'
import { texts } from '../../../constants/texts'
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
  userRating: null,
  userReview: null,
  userReviewCreatedAt: null,
}

function renderHeader(game = GAME, onAddToList = vi.fn()) {
  render(
    <MemoryRouter>
      <MuiThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <GameDetailsHeader game={game} onAddToWantToPlay={() => {}} addLoading={false} added={false} userRating={null} onRate={() => {}} ratingLoading={false} onAddToList={onAddToList} />
        </StyledThemeProvider>
      </MuiThemeProvider>
    </MemoryRouter>,
  )
  return { onAddToList }
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

test('renders the add-to-list button and calls onAddToList when clicked', async () => {
  const user = userEvent.setup()
  const { onAddToList } = renderHeader()
  await user.click(screen.getByRole('button', { name: texts.gameDetails.addToListButton }))
  expect(onAddToList).toHaveBeenCalledOnce()
})

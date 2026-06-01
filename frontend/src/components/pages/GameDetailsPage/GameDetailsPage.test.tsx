import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { theme } from '../../../theme/theme'
import { GameDetailsPage } from './GameDetailsPage'
import * as useGameDetailsHook from '../../../hooks/useGameDetails'
import type { GameDetailResponse, DetailsStatus } from '../../../types/game'

vi.mock('../../../hooks/useGameDetails')

const mockUseGameDetails = vi.mocked(useGameDetailsHook.useGameDetails)

const GAME: GameDetailResponse = {
  id: 'rawg-3498',
  name: 'Grand Theft Auto V',
  description: 'An open world game.',
  releaseDate: '2013-09-17',
  coverUrl: null,
  genres: ['Action'],
  platforms: ['PC'],
  developers: ['Rockstar Games'],
  platformAverageRating: null,
  rawgRating: 4.5,
  screenshots: [],
  userRating: null,
}

function mockHook(status: DetailsStatus, data: GameDetailResponse | null = null, refetch = vi.fn()) {
  mockUseGameDetails.mockReturnValue(
    { status, data, refetch } as ReturnType<typeof useGameDetailsHook.useGameDetails>,
  )
}

function renderPage(gameId = 'rawg-3498') {
  return render(
    <MemoryRouter initialEntries={[`/games/${gameId}`]}>
      <Routes>
        <Route
          path="/games/:gameId"
          element={
            <MuiThemeProvider theme={theme}>
              <StyledThemeProvider theme={theme}>
                <GameDetailsPage />
              </StyledThemeProvider>
            </MuiThemeProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => vi.clearAllMocks())

test('shows loading spinner while fetching', () => {
  mockHook('loading')
  renderPage()
  expect(screen.getByRole('progressbar')).toBeInTheDocument()
})

test('renders game details on success', () => {
  mockHook('success', GAME)
  renderPage()
  expect(screen.getByRole('heading', { name: 'Grand Theft Auto V' })).toBeInTheDocument()
  expect(screen.getByText('Sobre')).toBeInTheDocument()
  expect(screen.getByText('Screenshots')).toBeInTheDocument()
})

test('shows empty state on 404', () => {
  mockHook('not-found')
  renderPage()
  expect(screen.getByText('Jogo não encontrado')).toBeInTheDocument()
})

test('shows error message and retry button on error', () => {
  mockHook('error')
  renderPage()
  expect(screen.getByText('Não foi possível carregar os detalhes deste jogo.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
})

test('calls refetch when retry button is clicked', () => {
  const refetch = vi.fn()
  mockUseGameDetails.mockReturnValue({ status: 'error', data: null, refetch })
  renderPage()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(refetch).toHaveBeenCalledOnce()
})

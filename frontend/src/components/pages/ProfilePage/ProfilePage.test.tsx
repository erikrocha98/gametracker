import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { texts } from '../../../constants/texts'
import type { CollectionStats } from '../../../types/game'
import { ProfilePage } from './ProfilePage'
import * as gamesService from '../../../services/games'

vi.mock('../../../services/games')

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: 'erik',
      email: 'erik@test.com',
      email_verified: true,
      bio: 'jogo desde os 8 anos',
      avatarUrl: null,
      memberSince: '2024-01-01T00:00:00Z',
    },
    status: 'authenticated',
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  }),
}))

const mockGetStats = vi.mocked(gamesService.getCollectionStats)

const STATS: CollectionStats = {
  gamesRated: 4,
  averageRating: 4.2,
  statusCounts: { wantToPlay: 2, playing: 1, finished: 3 },
  recentGames: [
    {
      id: 1,
      gameId: 'rawg-1',
      name: 'Hollow Knight',
      coverUrl: null,
      platforms: ['PC'],
      releaseYear: 2017,
      rating: 5,
      status: 'finished',
    },
  ],
}

function renderPage() {
  render(
    <MemoryRouter>
      <MuiThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <ProfilePage />
        </StyledThemeProvider>
      </MuiThemeProvider>
    </MemoryRouter>,
  )
}

test('renders the profile with stats and recent games after loading', async () => {
  mockGetStats.mockResolvedValue(STATS)
  renderPage()

  // findBy: os dados só aparecem depois de getCollectionStats resolver
  expect(await screen.findByText('Hollow Knight')).toBeInTheDocument()
  expect(screen.getByText(texts.profile.gamesRatedLabel)).toBeInTheDocument()
  // a nota média da coleção flui do stats para o ProfileCard
  expect(screen.getByText('4.2')).toBeInTheDocument()
  // a bio do usuário (via useAuth) preenche o campo editável
  expect(screen.getByRole('textbox')).toHaveValue('jogo desde os 8 anos')
})

test('shows an error message when the stats request fails', async () => {
  mockGetStats.mockRejectedValue(new Error('network error'))
  renderPage()

  expect(await screen.findByText(texts.profile.loadError)).toBeInTheDocument()
})

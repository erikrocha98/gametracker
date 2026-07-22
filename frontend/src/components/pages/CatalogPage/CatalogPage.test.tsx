import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { CatalogPage } from './CatalogPage'
import * as gamesService from '../../../services/games'

vi.mock('../../../services/games')

const mockGetCollection = vi.mocked(gamesService.getCollection)
const mockGetUserReviews = vi.mocked(gamesService.getUserReviews)

function renderPage() {
  return render(
    <MemoryRouter>
      <MuiThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <CatalogPage />
        </StyledThemeProvider>
      </MuiThemeProvider>
    </MemoryRouter>,
  )
}

test('renders hero title', async () => {
  mockGetCollection.mockResolvedValue({ items: [] })
  renderPage()
  expect(screen.getByText('Seu diário de jogos.')).toBeInTheDocument()
})

test('shows empty state after collection loads with no items', async () => {
  mockGetCollection.mockResolvedValue({ items: [] })
  renderPage()
  await waitFor(() => expect(screen.getByText('Nenhuma atividade ainda')).toBeInTheDocument())
})

test('shows error state when collection fails to load', async () => {
  mockGetCollection.mockRejectedValue(new Error('Network error'))
  renderPage()
  await waitFor(() =>
    expect(screen.getByText('Não foi possível carregar sua coleção.')).toBeInTheDocument(),
  )
})

test('loads and shows the user reviews when the reviews filter is selected', async () => {
  const user = userEvent.setup()
  mockGetCollection.mockResolvedValue({ items: [] })
  mockGetUserReviews.mockResolvedValue({
    items: [
      {
        gameId: 'g1',
        name: 'Hollow Knight',
        coverUrl: null,
        platforms: ['PC'],
        releaseYear: 2017,
        rating: 9,
        review: 'Incrível',
        reviewCreatedAt: '2026-07-13T00:00:00Z',
      },
    ],
  })
  renderPage()

  await user.click(screen.getByRole('tab', { name: 'Reviews' }))

  expect(await screen.findByText('Hollow Knight')).toBeInTheDocument()
})

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { ReviewsPage } from './ReviewsPage'
import { texts } from '../../../constants/texts'
import { getUserReviews } from '../../../services/games'
import type { UserReview } from '../../../types/game'

vi.mock('../../../services/games')

const reviews: UserReview[] = [
  {
    gameId: 'rawg-1',
    name: 'The Witcher 3',
    coverUrl: null,
    platforms: ['PC'],
    releaseYear: 2015,
    rating: 4.5,
    review: 'História incrível.',
    reviewCreatedAt: '2026-07-13T00:00:00Z',
  },
  {
    gameId: 'rawg-2',
    name: 'Hollow Knight',
    coverUrl: null,
    platforms: ['PC'],
    releaseYear: 2017,
    rating: 5,
    review: 'Metroidvania perfeito.',
    reviewCreatedAt: '2026-07-14T00:00:00Z',
  },
]

function renderPage() {
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <ReviewsPage />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(getUserReviews).mockReset()
})

test('renders the reviews returned by the service', async () => {
  vi.mocked(getUserReviews).mockResolvedValue({ items: reviews })
  renderPage()
  expect(await screen.findByText('The Witcher 3')).toBeInTheDocument()
  expect(screen.getByText('Hollow Knight')).toBeInTheDocument()
})

test('renders the empty state when there are no reviews', async () => {
  vi.mocked(getUserReviews).mockResolvedValue({ items: [] })
  renderPage()
  expect(await screen.findByText(texts.reviews.emptyTitle)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: texts.reviews.emptyAction })).toBeInTheDocument()
})

test('renders the error message when the request fails', async () => {
  vi.mocked(getUserReviews).mockRejectedValue(new Error('boom'))
  renderPage()
  expect(await screen.findByText(texts.reviews.loadError)).toBeInTheDocument()
})

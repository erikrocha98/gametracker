import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { ReviewCard } from './ReviewCard'
import type { UserReview } from '../../../types/game'

const review: UserReview = {
  gameId: 'rawg-1',
  name: 'The Witcher 3',
  coverUrl: null,
  platforms: ['PC'],
  releaseYear: 2015,
  rating: 4.5,
  review: 'Uma das melhores histórias já contadas em um jogo.',
  reviewCreatedAt: '2026-07-13T00:00:00Z',
}

function renderCard(props: Partial<UserReview> = {}) {
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <ReviewCard review={{ ...review, ...props }} />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

test('renders the game name and the review excerpt', () => {
  renderCard()
  expect(screen.getByText('The Witcher 3')).toBeInTheDocument()
  expect(screen.getByText(/uma das melhores histórias/i)).toBeInTheDocument()
})

test('renders the formatted creation date', () => {
  renderCard()
  // formatReleaseDate usa Intl pt-BR → dd/mm/aaaa
  expect(screen.getByText('13/07/2026')).toBeInTheDocument()
})

test('links to the game details page', () => {
  renderCard()
  expect(screen.getByRole('link')).toHaveAttribute('href', '/games/rawg-1')
})

test('does not render a date when reviewCreatedAt is null', () => {
  renderCard({ reviewCreatedAt: null })
  expect(screen.queryByText('13/07/2026')).not.toBeInTheDocument()
})

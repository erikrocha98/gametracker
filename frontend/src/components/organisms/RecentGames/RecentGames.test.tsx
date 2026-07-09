import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { texts } from '../../../constants/texts'
import type { CollectionGame } from '../../../types/game'
import { RecentGames } from './RecentGames'

function renderRecentGames(games: CollectionGame[]) {
  render(
    <MemoryRouter>
      <MuiThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <RecentGames games={games} />
        </StyledThemeProvider>
      </MuiThemeProvider>
    </MemoryRouter>,
  )
}

test('shows the empty state with an add-game action when there are no games', () => {
  renderRecentGames([])

  expect(screen.getByText(texts.profile.emptyTitle)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: texts.profile.emptyAction })).toBeInTheDocument()
})

test('renders a card for each recent game and hides the empty state', () => {
  const games: CollectionGame[] = [
    {
      id: 1,
      gameId: 'rawg-1',
      name: 'The Legend of Zelda',
      coverUrl: null,
      platforms: ['Switch'],
      releaseYear: 2017,
      rating: 4,
      status: 'finished',
    },
  ]
  renderRecentGames(games)

  expect(screen.getByText('The Legend of Zelda')).toBeInTheDocument()
  expect(screen.queryByText(texts.profile.emptyTitle)).not.toBeInTheDocument()
})

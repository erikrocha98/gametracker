import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { MyGamesPage } from './MyGamesPage'
import { texts } from '../../../constants/texts'

vi.mock('../../../services/games', () => ({
  getCollection: () => Promise.resolve({ items: [] }),
  removeFromWantToPlay: () => Promise.resolve(),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <MyGamesPage />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

test('renders page title', async () => {
  renderPage()
  expect(await screen.findByText(texts.myGames.pageTitle)).toBeInTheDocument()
})

test('renders empty state when collection is empty', async () => {
  renderPage()
  expect(await screen.findByText(texts.myGames.emptyTitle)).toBeInTheDocument()
})

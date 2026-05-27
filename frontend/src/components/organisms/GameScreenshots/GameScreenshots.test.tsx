import { render, screen } from '@testing-library/react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { GameScreenshots } from './GameScreenshots'

function renderScreenshots(screenshots: string[]) {
  return render(
    <MuiThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <GameScreenshots screenshots={screenshots} />
      </StyledThemeProvider>
    </MuiThemeProvider>,
  )
}

test('renders the correct number of images', () => {
  const urls = [
    'https://example.com/ss1.jpg',
    'https://example.com/ss2.jpg',
    'https://example.com/ss3.jpg',
  ]
  renderScreenshots(urls)
  expect(screen.getAllByRole('img')).toHaveLength(3)
})

test('renders fallback text when screenshots list is empty', () => {
  renderScreenshots([])
  expect(screen.getByText('Sem screenshots disponíveis.')).toBeInTheDocument()
})

test('renders section title', () => {
  renderScreenshots([])
  expect(screen.getByText('Screenshots')).toBeInTheDocument()
})

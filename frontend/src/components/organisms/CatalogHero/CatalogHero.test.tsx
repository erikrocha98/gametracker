import { render, screen } from '@testing-library/react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { CatalogHero } from './CatalogHero'

test('renders hero title and subtitle', () => {
  render(
    <MuiThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <CatalogHero />
      </StyledThemeProvider>
    </MuiThemeProvider>,
  )
  expect(screen.getByText('Seu diário de jogos.')).toBeInTheDocument()
  expect(
    screen.getByText('Descubra, avalie e comente os jogos que marcaram a sua jornada.'),
  ).toBeInTheDocument()
})

import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { MemoryRouter } from 'react-router-dom'
import { theme } from '../../../theme/theme'
import { LoginPage } from './LoginPage'

test('renders logo and login tab active', () => {
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <LoginPage />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
  expect(screen.getByText('playlogd')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Entrar' })).toHaveAttribute('aria-selected', 'true')
})

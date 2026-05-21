import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { MemoryRouter } from 'react-router-dom'
import { theme } from '../../../theme/theme'
import { SignUpPage } from './SignUpPage'

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ loginWithGoogle: vi.fn() }),
}))

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => null,
}))

test('renders logo and signup tab', () => {
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <SignUpPage />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
  expect(screen.getByText('playlogd')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Criar conta' })).toBeInTheDocument()
})

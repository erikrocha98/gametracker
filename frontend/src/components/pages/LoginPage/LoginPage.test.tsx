import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { MemoryRouter } from 'react-router-dom'
import { theme } from '../../../theme/theme'
import { texts } from '../../../constants/texts'
import { LoginPage } from './LoginPage'

const mockLogin = vi.fn()

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => null,
}))

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    status: 'guest',
    login: mockLogin,
    logout: vi.fn(),
  }),
}))

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <LoginPage />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

test('renders logo and login tab active', () => {
  renderLoginPage()
  expect(screen.getByText(texts.brand.name)).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Entrar' })).toHaveAttribute('aria-selected', 'true')
})

test('shows generic error message when login fails with 401', async () => {
  mockLogin.mockRejectedValue(new Response(null, { status: 401 }))
  const { container } = renderLoginPage()

  await userEvent.type(screen.getByPlaceholderText('voce@exemplo.com'), 'wrong@test.com')
  await userEvent.type(container.querySelector('input[name="password"]')!, 'wrongpass')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

  await waitFor(() => {
    expect(screen.getByText('E-mail ou senha inválidos.')).toBeInTheDocument()
  })
})

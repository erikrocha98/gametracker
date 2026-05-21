import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { MemoryRouter } from 'react-router-dom'
import { theme } from '../../../theme/theme'
import { LoginForm } from './LoginForm'

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ loginWithGoogle: vi.fn() }),
}))

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => null,
}))

function renderLoginForm(onSubmit = vi.fn()) {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <LoginForm onSubmit={onSubmit} />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

test('shows validation errors on empty submit', async () => {
  renderLoginForm()
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  await waitFor(() => {
    expect(screen.getByText('E-mail inválido')).toBeInTheDocument()
    expect(screen.getByText('Informe sua senha')).toBeInTheDocument()
  })
})

test('shows error for malformed email', async () => {
  renderLoginForm()
  await userEvent.type(screen.getByPlaceholderText('voce@exemplo.com'), 'nao-e-email')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  await waitFor(() => {
    expect(screen.getByText('E-mail inválido')).toBeInTheDocument()
  })
})

test('calls onSubmit with correct data including remember_me false by default', async () => {
  const onSubmit = vi.fn()
  const { container } = renderLoginForm(onSubmit)
  await userEvent.type(screen.getByPlaceholderText('voce@exemplo.com'), 'joao@test.com')
  await userEvent.type(container.querySelector('input[name="password"]')!, 'minhasenha')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'joao@test.com',
      password: 'minhasenha',
      remember_me: false,
    })
  })
})

test('renders remember_me checkbox unchecked by default', () => {
  renderLoginForm()
  const checkbox = screen.getByRole('checkbox', { name: 'Lembrar de mim' })
  expect(checkbox).not.toBeChecked()
})

test('calls onSubmit with remember_me true when checkbox is checked', async () => {
  const onSubmit = vi.fn()
  const { container } = renderLoginForm(onSubmit)
  await userEvent.type(screen.getByPlaceholderText('voce@exemplo.com'), 'joao@test.com')
  await userEvent.type(container.querySelector('input[name="password"]')!, 'minhasenha')
  await userEvent.click(screen.getByRole('checkbox', { name: 'Lembrar de mim' }))
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'joao@test.com',
      password: 'minhasenha',
      remember_me: true,
    })
  })
})

test('shows apiError alert when provided', () => {
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <LoginForm apiError="E-mail ou senha inválidos." />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
  expect(screen.getByText('E-mail ou senha inválidos.')).toBeInTheDocument()
})

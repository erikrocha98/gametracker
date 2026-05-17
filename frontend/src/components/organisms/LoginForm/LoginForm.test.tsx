import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { LoginForm } from './LoginForm'

function renderLoginForm(onSubmit = vi.fn()) {
  return render(
    <ThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <LoginForm onSubmit={onSubmit} />
      </StyledThemeProvider>
    </ThemeProvider>,
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

test('calls onSubmit with correct data on valid submission', async () => {
  const onSubmit = vi.fn()
  const { container } = renderLoginForm(onSubmit)
  await userEvent.type(screen.getByPlaceholderText('voce@exemplo.com'), 'joao@test.com')
  await userEvent.type(container.querySelector('input[name="password"]')!, 'minhasenha')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'joao@test.com',
      password: 'minhasenha',
    })
  })
})

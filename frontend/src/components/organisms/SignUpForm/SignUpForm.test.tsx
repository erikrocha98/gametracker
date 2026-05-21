import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { MemoryRouter } from 'react-router-dom'
import { theme } from '../../../theme/theme'
import { SignUpForm } from './SignUpForm'

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ loginWithGoogle: vi.fn() }),
}))

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => null,
}))

function renderSignUpForm(onSubmit = vi.fn()) {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <SignUpForm onSubmit={onSubmit} />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

test('shows all validation errors on empty submit', async () => {
  renderSignUpForm()
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  await waitFor(() => {
    expect(screen.getByText('Mínimo 3 caracteres')).toBeInTheDocument()
    expect(screen.getByText('E-mail inválido')).toBeInTheDocument()
    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument()
    expect(screen.getByText('Confirme sua senha')).toBeInTheDocument()
  })
})

test('rejects username with invalid characters', async () => {
  renderSignUpForm()
  await userEvent.type(screen.getByPlaceholderText('ex: joao_silva'), 'João Silva')
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  await waitFor(() => {
    expect(screen.getByText('Apenas letras, números e _')).toBeInTheDocument()
  })
})

test('rejects username shorter than 3 characters', async () => {
  renderSignUpForm()
  await userEvent.type(screen.getByPlaceholderText('ex: joao_silva'), 'ab')
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  await waitFor(() => {
    expect(screen.getByText('Mínimo 3 caracteres')).toBeInTheDocument()
  })
})

test('rejects password shorter than 8 characters', async () => {
  const { container } = renderSignUpForm()
  await userEvent.type(screen.getByPlaceholderText('ex: joao_silva'), 'joao_silva')
  await userEvent.type(screen.getByPlaceholderText('voce@exemplo.com'), 'joao@test.com')
  await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'abc@1')
  await userEvent.type(container.querySelector('input[name="confirmPassword"]')!, 'abc@1')
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  await waitFor(() => {
    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument()
  })
})

test('rejects password without special character', async () => {
  const { container } = renderSignUpForm()
  await userEvent.type(screen.getByPlaceholderText('ex: joao_silva'), 'joao_silva')
  await userEvent.type(screen.getByPlaceholderText('voce@exemplo.com'), 'joao@test.com')
  await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'Senha1234')
  await userEvent.type(container.querySelector('input[name="confirmPassword"]')!, 'Senha1234')
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  await waitFor(() => {
    expect(screen.getByText('Deve conter pelo menos um caractere especial')).toBeInTheDocument()
  })
})

test('rejects mismatched passwords', async () => {
  const { container } = renderSignUpForm()
  await userEvent.type(screen.getByPlaceholderText('ex: joao_silva'), 'joao_silva')
  await userEvent.type(screen.getByPlaceholderText('voce@exemplo.com'), 'joao@test.com')
  await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'Senha@123')
  await userEvent.type(container.querySelector('input[name="confirmPassword"]')!, 'Senha@456')
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  await waitFor(() => {
    expect(screen.getByText('Senhas não coincidem')).toBeInTheDocument()
  })
})

test('calls onSubmit with correct data on valid submission', async () => {
  const onSubmit = vi.fn()
  const { container } = renderSignUpForm(onSubmit)
  await userEvent.type(screen.getByPlaceholderText('ex: joao_silva'), 'joao_silva')
  await userEvent.type(screen.getByPlaceholderText('voce@exemplo.com'), 'joao@test.com')
  await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'Senha@123')
  await userEvent.type(container.querySelector('input[name="confirmPassword"]')!, 'Senha@123')
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      username: 'joao_silva',
      email: 'joao@test.com',
      password: 'Senha@123',
      confirmPassword: 'Senha@123',
    })
  })
})

test('shows apiError alert when provided', () => {
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <SignUpForm apiError="Não foi possível criar a conta." />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
  expect(screen.getByText('Não foi possível criar a conta.')).toBeInTheDocument()
})

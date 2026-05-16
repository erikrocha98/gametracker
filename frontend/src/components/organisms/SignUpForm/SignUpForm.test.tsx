import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { SignUpForm } from './SignUpForm'

function renderSignUpForm(onSubmit = vi.fn()) {
  return render(
    <ThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <SignUpForm onSubmit={onSubmit} />
      </StyledThemeProvider>
    </ThemeProvider>,
  )
}

test('shows all validation errors on empty submit', async () => {
  renderSignUpForm()
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  await waitFor(() => {
    expect(screen.getByText('Informe seu nome')).toBeInTheDocument()
    expect(screen.getByText('E-mail inválido')).toBeInTheDocument()
    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument()
  })
})

test('rejects name with SQL injection characters', async () => {
  renderSignUpForm()
  await userEvent.type(screen.getByPlaceholderText('Seu nome'), "João'; DROP TABLE users--")
  await userEvent.type(screen.getByPlaceholderText('voce@exemplo.com'), 'joao@test.com')
  await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'Senha@123')
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  await waitFor(() => {
    expect(screen.getByText('Nome contém caracteres inválidos')).toBeInTheDocument()
  })
})

test('rejects password shorter than 8 characters', async () => {
  renderSignUpForm()
  await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'João')
  await userEvent.type(screen.getByPlaceholderText('voce@exemplo.com'), 'joao@test.com')
  await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'abc@1')
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  await waitFor(() => {
    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument()
  })
})

test('rejects password without special character', async () => {
  renderSignUpForm()
  await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'João')
  await userEvent.type(screen.getByPlaceholderText('voce@exemplo.com'), 'joao@test.com')
  await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'Senha1234')
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  await waitFor(() => {
    expect(screen.getByText('Deve conter pelo menos um caractere especial')).toBeInTheDocument()
  })
})

test('calls onSubmit with correct data on valid submission', async () => {
  const onSubmit = vi.fn()
  renderSignUpForm(onSubmit)
  await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'João')
  await userEvent.type(screen.getByPlaceholderText('voce@exemplo.com'), 'joao@test.com')
  await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'Senha@123')
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'João',
      email: 'joao@test.com',
      password: 'Senha@123',
    })
  })
})

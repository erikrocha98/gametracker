import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../../../theme/theme'
import { FormField } from './FormField'

function TestField({ error }: { error?: string }) {
  const { register } = useForm<{ email: string }>()
  return (
    <ThemeProvider theme={theme}>
      <FormField
        label="E-mail"
        name="email"
        register={register}
        error={error}
        placeholder="voce@exemplo.com"
      />
    </ThemeProvider>
  )
}

function TestPasswordField() {
  const { register } = useForm<{ password: string }>()
  return (
    <ThemeProvider theme={theme}>
      <FormField
        label="Senha"
        name="password"
        register={register}
        type="password"
        showPasswordToggle
      />
    </ThemeProvider>
  )
}

test('renders the label', () => {
  render(<TestField />)
  expect(screen.getByText('E-mail')).toBeInTheDocument()
})

test('renders error message when provided', () => {
  render(<TestField error="Campo obrigatório" />)
  expect(screen.getByRole('alert')).toHaveTextContent('Campo obrigatório')
})

test('does not render error when not provided', () => {
  render(<TestField />)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('renders password toggle button when showPasswordToggle is true', () => {
  render(<TestPasswordField />)
  expect(screen.getByRole('button', { name: 'Mostrar senha' })).toBeInTheDocument()
})

test('toggles password visibility when toggle button is clicked', async () => {
  const { container } = render(<TestPasswordField />)
  const input = container.querySelector('input[name="password"]') as HTMLInputElement
  expect(input.type).toBe('password')
  await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
  expect(input.type).toBe('text')
  await userEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))
  expect(input.type).toBe('password')
})

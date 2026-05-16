import { render, screen } from '@testing-library/react'
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

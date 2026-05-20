import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { AuthCard } from './AuthCard'

vi.mock('../../../services/auth', () => ({
  signup: vi.fn(),
}))

function renderAuthCard(initialTab?: 'login' | 'signup') {
  return render(
    <ThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <AuthCard initialTab={initialTab} />
      </StyledThemeProvider>
    </ThemeProvider>,
  )
}

test('renders signup form by default', () => {
  renderAuthCard()
  expect(screen.getByPlaceholderText('ex: joao_silva')).toBeInTheDocument()
})

test('shows login form when login tab is clicked', async () => {
  renderAuthCard()
  await userEvent.click(screen.getByRole('tab', { name: 'Entrar' }))
  expect(screen.getByPlaceholderText('voce@exemplo.com')).toBeInTheDocument()
})

test('renders login form directly when initialTab is login', () => {
  renderAuthCard('login')
  expect(screen.getByPlaceholderText('voce@exemplo.com')).toBeInTheDocument()
})

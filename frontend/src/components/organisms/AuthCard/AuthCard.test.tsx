import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { MemoryRouter } from 'react-router-dom'
import { theme } from '../../../theme/theme'
import { AuthCard } from './AuthCard'
import { texts } from '../../../constants/texts'

const mockSignup = vi.fn()

vi.mock('../../../services/auth', () => ({
  signup: (...args: unknown[]) => mockSignup(...args),
}))

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ loginWithGoogle: vi.fn() }),
}))

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => null,
}))

function renderAuthCard(initialTab?: 'login' | 'signup') {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <AuthCard initialTab={initialTab} />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

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

test('shows success modal after successful signup', async () => {
  mockSignup.mockResolvedValue(undefined)
  const { container } = renderAuthCard()

  await userEvent.type(screen.getByPlaceholderText('ex: joao_silva'), 'joao_silva')
  await userEvent.type(screen.getByPlaceholderText('voce@exemplo.com'), 'joao@test.com')
  await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'Senha@123')
  await userEvent.type(container.querySelector('input[name="confirmPassword"]')!, 'Senha@123')
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

  await waitFor(() => {
    expect(screen.getByText(texts.signUp.successMessage)).toBeInTheDocument()
  })
})

test('shows error modal after failed signup', async () => {
  mockSignup.mockRejectedValue(new Error('server error'))
  const { container } = renderAuthCard()

  await userEvent.type(screen.getByPlaceholderText('ex: joao_silva'), 'joao_silva')
  await userEvent.type(screen.getByPlaceholderText('voce@exemplo.com'), 'joao@test.com')
  await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'Senha@123')
  await userEvent.type(container.querySelector('input[name="confirmPassword"]')!, 'Senha@123')
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

  await waitFor(() => {
    expect(screen.getByText(texts.signUp.errorMessage)).toBeInTheDocument()
  })
})

test('closes error modal and stays on signup when X is clicked', async () => {
  mockSignup.mockRejectedValue(new Error('server error'))
  const { container } = renderAuthCard()

  await userEvent.type(screen.getByPlaceholderText('ex: joao_silva'), 'joao_silva')
  await userEvent.type(screen.getByPlaceholderText('voce@exemplo.com'), 'joao@test.com')
  await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'Senha@123')
  await userEvent.type(container.querySelector('input[name="confirmPassword"]')!, 'Senha@123')
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

  await waitFor(() => {
    expect(screen.getByText(texts.signUp.errorMessage)).toBeInTheDocument()
  })

  await userEvent.click(screen.getByRole('button', { name: texts.feedbackModal.closeAriaLabel }))

  await waitFor(() => {
    expect(screen.queryByText(texts.signUp.errorMessage)).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('ex: joao_silva')).toBeInTheDocument()
  })
})

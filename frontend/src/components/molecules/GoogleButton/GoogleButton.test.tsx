import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { GoogleButton } from './GoogleButton'

const mockLoginWithGoogle = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }: { onSuccess: (r: { credential: string }) => void }) => (
    <button data-testid="google-oauth-trigger" onClick={() => onSuccess({ credential: 'fake-token' })}>
      google-oauth
    </button>
  ),
}))

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ loginWithGoogle: mockLoginWithGoogle }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderButton() {
  return render(
    <MemoryRouter>
      <GoogleButton />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('renders the Google login button', () => {
  renderButton()
  expect(screen.getByText('Continuar com Google')).toBeInTheDocument()
})

test('calls loginWithGoogle and navigates on success', async () => {
  mockLoginWithGoogle.mockResolvedValue(undefined)
  renderButton()

  screen.getByTestId('google-oauth-trigger').click()

  await vi.waitFor(() => {
    expect(mockLoginWithGoogle).toHaveBeenCalledWith('fake-token')
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })
})

test('shows error alert when loginWithGoogle fails', async () => {
  mockLoginWithGoogle.mockRejectedValue(new Error('auth failed'))
  renderButton()

  screen.getByTestId('google-oauth-trigger').click()

  await vi.waitFor(() => {
    expect(
      screen.getByText('Não foi possível autenticar com o Google. Tente novamente.'),
    ).toBeInTheDocument()
  })
})

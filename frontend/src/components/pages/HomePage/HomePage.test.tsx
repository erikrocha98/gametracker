import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { HomePage } from './HomePage'

const mockLogout = vi.fn()

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'erikrocha', email: 'erik@test.com', email_verified: true },
    status: 'authenticated',
    login: vi.fn(),
    logout: mockLogout,
  }),
}))

function renderHomePage() {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <HomePage />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

test('shows greeting with username', () => {
  renderHomePage()
  expect(screen.getByText('Olá, erikrocha!')).toBeInTheDocument()
})

test('calls logout when sair button is clicked', async () => {
  mockLogout.mockResolvedValue(undefined)
  renderHomePage()
  await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
  expect(mockLogout).toHaveBeenCalled()
})

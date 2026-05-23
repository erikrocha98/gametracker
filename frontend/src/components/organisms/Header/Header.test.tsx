import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { MemoryRouter } from 'react-router-dom'
import { theme } from '../../../theme/theme'
import { Header } from './Header'

const mockLogout = vi.fn().mockResolvedValue(undefined)

vi.mock('../../../hooks/useGameSearch', () => ({
  useGameSearch: () => ({ status: 'idle', results: [] }),
}))

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ logout: mockLogout }),
}))

function renderHeader() {
  return render(
    <MemoryRouter>
      <MuiThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <Header />
        </StyledThemeProvider>
      </MuiThemeProvider>
    </MemoryRouter>,
  )
}

test('renders navigation links', () => {
  renderHeader()
  expect(screen.getByRole('link', { name: 'Catálogo' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Adicionar' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Perfil' })).toBeInTheDocument()
})

test('renders search input', () => {
  renderHeader()
  expect(screen.getByPlaceholderText('Buscar jogos...')).toBeInTheDocument()
})

test('renders logout button', () => {
  renderHeader()
  expect(screen.getByLabelText('Sair')).toBeInTheDocument()
})

test('calls logout when logout button is clicked', async () => {
  renderHeader()
  await userEvent.click(screen.getByLabelText('Sair'))
  expect(mockLogout).toHaveBeenCalled()
})

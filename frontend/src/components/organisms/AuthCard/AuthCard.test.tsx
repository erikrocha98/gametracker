import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { AuthCard } from './AuthCard'

function renderAuthCard() {
  return render(
    <ThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <AuthCard />
      </StyledThemeProvider>
    </ThemeProvider>,
  )
}

test('renders signup form by default', () => {
  renderAuthCard()
  expect(screen.getByPlaceholderText('Seu nome')).toBeInTheDocument()
})

test('shows placeholder when login tab is selected', async () => {
  renderAuthCard()
  await userEvent.click(screen.getByText('Entrar'))
  expect(screen.getByText('Em breve')).toBeInTheDocument()
})

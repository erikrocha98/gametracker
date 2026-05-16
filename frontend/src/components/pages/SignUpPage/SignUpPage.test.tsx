import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { SignUpPage } from './SignUpPage'

test('renders logo and signup tab', () => {
  render(
    <ThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <SignUpPage />
      </StyledThemeProvider>
    </ThemeProvider>,
  )
  expect(screen.getByText('playlogd')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Criar conta' })).toBeInTheDocument()
})

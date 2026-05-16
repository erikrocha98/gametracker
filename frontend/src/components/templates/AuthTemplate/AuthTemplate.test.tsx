import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { AuthTemplate } from './AuthTemplate'

test('renders logo and children', () => {
  render(
    <ThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <AuthTemplate>
          <div>test content</div>
        </AuthTemplate>
      </StyledThemeProvider>
    </ThemeProvider>,
  )
  expect(screen.getByText('playlogd')).toBeInTheDocument()
  expect(screen.getByText('test content')).toBeInTheDocument()
})

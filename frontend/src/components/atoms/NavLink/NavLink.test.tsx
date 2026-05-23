import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { NavLink } from './NavLink'

function renderNavLink(to: string, initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <MuiThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <NavLink to={to}>Catálogo</NavLink>
        </StyledThemeProvider>
      </MuiThemeProvider>
    </MemoryRouter>,
  )
}

test('renders link with correct href', () => {
  renderNavLink('/')
  expect(screen.getByRole('link', { name: 'Catálogo' })).toHaveAttribute('href', '/')
})

test('link is active when path matches', () => {
  renderNavLink('/', '/')
  expect(screen.getByRole('link')).toHaveClass('active')
})

test('link is not active when path does not match', () => {
  renderNavLink('/outra', '/')
  expect(screen.getByRole('link')).not.toHaveClass('active')
})

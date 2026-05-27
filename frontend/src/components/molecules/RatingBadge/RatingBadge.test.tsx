import { render, screen } from '@testing-library/react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { RatingBadge } from './RatingBadge'

function renderBadge(props: Parameters<typeof RatingBadge>[0]) {
  return render(
    <MuiThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <RatingBadge {...props} />
      </StyledThemeProvider>
    </MuiThemeProvider>,
  )
}

test('renders label', () => {
  renderBadge({ label: 'RAWG', value: 4.5 })
  expect(screen.getByText('RAWG')).toBeInTheDocument()
})

test('renders formatted value', () => {
  renderBadge({ label: 'RAWG', value: 4.5 })
  expect(screen.getByText('4.5')).toBeInTheDocument()
})

test('renders — when value is null', () => {
  renderBadge({ label: 'RAWG', value: null })
  expect(screen.getByText('—')).toBeInTheDocument()
})

test('renders "Em breve" when comingSoon is true', () => {
  renderBadge({ label: 'Plataforma', value: null, comingSoon: true })
  expect(screen.getByText('Em breve')).toBeInTheDocument()
})

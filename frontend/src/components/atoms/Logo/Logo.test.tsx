import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../../../theme/theme'
import { Logo } from './Logo'

function renderLogo(props: { size?: 'sm' | 'md' } = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <Logo {...props} />
    </ThemeProvider>,
  )
}

test('renders playlogd text', () => {
  renderLogo()
  expect(screen.getByText('playlogd')).toBeInTheDocument()
})

test('renders the gamepad icon', () => {
  renderLogo()
  expect(document.querySelector('svg')).toBeInTheDocument()
})

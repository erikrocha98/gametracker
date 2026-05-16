import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../../../theme/theme'
import { GoogleButton } from './GoogleButton'

function renderGoogleButton(onClick = vi.fn()) {
  return render(
    <ThemeProvider theme={theme}>
      <GoogleButton onClick={onClick} />
    </ThemeProvider>,
  )
}

test('renders the button label', () => {
  renderGoogleButton()
  expect(screen.getByText('Continuar com Google')).toBeInTheDocument()
})

test('calls onClick when clicked', async () => {
  const onClick = vi.fn()
  renderGoogleButton(onClick)
  await userEvent.click(screen.getByText('Continuar com Google'))
  expect(onClick).toHaveBeenCalledTimes(1)
})

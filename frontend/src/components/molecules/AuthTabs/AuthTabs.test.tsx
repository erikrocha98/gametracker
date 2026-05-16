import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../../../theme/theme'
import { AuthTabs } from './AuthTabs'
import type { AuthTabValue } from './AuthTabs'

function renderAuthTabs(value: AuthTabValue, onChange = vi.fn()) {
  return render(
    <ThemeProvider theme={theme}>
      <AuthTabs value={value} onChange={onChange} />
    </ThemeProvider>,
  )
}

test('renders both tabs', () => {
  renderAuthTabs('signup')
  expect(screen.getByText('Entrar')).toBeInTheDocument()
  expect(screen.getByText('Criar conta')).toBeInTheDocument()
})

test('calls onChange when clicking a tab', async () => {
  const onChange = vi.fn()
  renderAuthTabs('signup', onChange)
  await userEvent.click(screen.getByText('Entrar'))
  expect(onChange).toHaveBeenCalledWith('login')
})

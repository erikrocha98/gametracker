import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { EmptyState } from './EmptyState'

function renderEmptyState(props = {}) {
  return render(
    <MuiThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <EmptyState title="Sem jogos" description="Adicione o primeiro." {...props} />
      </StyledThemeProvider>
    </MuiThemeProvider>,
  )
}

test('renders title and description', () => {
  renderEmptyState()
  expect(screen.getByText('Sem jogos')).toBeInTheDocument()
  expect(screen.getByText('Adicione o primeiro.')).toBeInTheDocument()
})

test('renders action button when actionLabel and onAction are provided', () => {
  renderEmptyState({ actionLabel: 'Adicionar', onAction: vi.fn() })
  expect(screen.getByRole('button', { name: 'Adicionar' })).toBeInTheDocument()
})

test('calls onAction when button is clicked', async () => {
  const onAction = vi.fn()
  renderEmptyState({ actionLabel: 'Adicionar', onAction })
  await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
  expect(onAction).toHaveBeenCalled()
})

test('does not render button when actionLabel is not provided', () => {
  renderEmptyState()
  expect(screen.queryByRole('button')).toBeNull()
})

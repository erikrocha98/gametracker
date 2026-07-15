import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { ConfirmDialog } from './ConfirmDialog'

function renderDialog(props = {}) {
  const onConfirm = vi.fn()
  const onClose = vi.fn()
  render(
    <MuiThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <ConfirmDialog
          open
          title="Excluir lista"
          description="Tem certeza?"
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          onConfirm={onConfirm}
          onClose={onClose}
          {...props}
        />
      </StyledThemeProvider>
    </MuiThemeProvider>,
  )
  return { onConfirm, onClose }
}

test('renders the title and description', () => {
  renderDialog()
  expect(screen.getByRole('heading', { name: 'Excluir lista' })).toBeInTheDocument()
  expect(screen.getByText('Tem certeza?')).toBeInTheDocument()
})

test('calls onConfirm when the confirm button is clicked', async () => {
  const user = userEvent.setup()
  const { onConfirm } = renderDialog()
  await user.click(screen.getByRole('button', { name: 'Excluir' }))
  expect(onConfirm).toHaveBeenCalledOnce()
})

test('calls onClose when the cancel button is clicked', async () => {
  const user = userEvent.setup()
  const { onClose } = renderDialog()
  await user.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(onClose).toHaveBeenCalledOnce()
})

test('disables both actions while loading', () => {
  renderDialog({ loading: true })
  expect(screen.getByRole('button', { name: 'Excluir' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
})

test('is not rendered when closed', () => {
  renderDialog({ open: false })
  expect(screen.queryByRole('heading', { name: 'Excluir lista' })).not.toBeInTheDocument()
})

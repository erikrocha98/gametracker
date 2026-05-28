import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { AddGameModal } from './AddGameModal'
import { texts } from '../../../constants/texts'

function renderModal(open = true, onClose = vi.fn()) {
  return render(
    <ThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <AddGameModal open={open} onClose={onClose} />
      </StyledThemeProvider>
    </ThemeProvider>,
  )
}

test('renders modal title when open', () => {
  renderModal()
  expect(screen.getByText(texts.addGame.modalTitle)).toBeInTheDocument()
})

test('does not render modal when closed', () => {
  renderModal(false)
  expect(screen.queryByText(texts.addGame.modalTitle)).not.toBeInTheDocument()
})

test('renders search bar', () => {
  renderModal()
  expect(screen.getByPlaceholderText(texts.header.searchPlaceholder)).toBeInTheDocument()
})

test('calls onClose when dialog is dismissed', async () => {
  const onClose = vi.fn()
  renderModal(true, onClose)
  await userEvent.keyboard('{Escape}')
  expect(onClose).toHaveBeenCalled()
})

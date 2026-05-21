import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { FeedbackModal } from './FeedbackModal'
import type { FeedbackModalProps } from './FeedbackModal'
import { texts } from '../../../constants/texts'

function renderModal(props: Partial<FeedbackModalProps> = {}) {
  const onClose = vi.fn()
  render(
    <ThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <FeedbackModal
          type="success"
          message="Operação bem-sucedida"
          open
          onClose={onClose}
          {...props}
        />
      </StyledThemeProvider>
    </ThemeProvider>,
  )
  return { onClose }
}

test('renders the message', () => {
  renderModal({ message: 'Sucesso!' })
  expect(screen.getByText('Sucesso!')).toBeInTheDocument()
})

test('calls onClose automatically after autoCloseDuration for success type', () => {
  vi.useFakeTimers()
  const { onClose } = renderModal({ type: 'success', autoCloseDuration: 3000 })
  expect(onClose).not.toHaveBeenCalled()
  act(() => { vi.advanceTimersByTime(3000) })
  expect(onClose).toHaveBeenCalledTimes(1)
  vi.useRealTimers()
})

test('does not call onClose automatically for error type', () => {
  vi.useFakeTimers()
  const { onClose } = renderModal({ type: 'error' })
  act(() => { vi.advanceTimersByTime(10000) })
  expect(onClose).not.toHaveBeenCalled()
  vi.useRealTimers()
})

test('renders close button for error type', () => {
  renderModal({ type: 'error' })
  expect(screen.getByRole('button', { name: texts.feedbackModal.closeAriaLabel })).toBeInTheDocument()
})

test('does not render close button for success type', () => {
  renderModal({ type: 'success' })
  expect(screen.queryByRole('button', { name: texts.feedbackModal.closeAriaLabel })).not.toBeInTheDocument()
})

test('calls onClose when close button is clicked for error type', async () => {
  const { onClose } = renderModal({ type: 'error' })
  await userEvent.click(screen.getByRole('button', { name: texts.feedbackModal.closeAriaLabel }))
  expect(onClose).toHaveBeenCalledTimes(1)
})

test('does not auto-close when modal is closed before timer fires', () => {
  vi.useFakeTimers()
  const { onClose } = renderModal({ type: 'success', open: false })
  act(() => { vi.advanceTimersByTime(3000) })
  expect(onClose).not.toHaveBeenCalled()
  vi.useRealTimers()
})

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { ReviewSection } from './ReviewSection'
import { texts } from '../../../constants/texts'

interface Overrides {
  review?: string | null
  reviewCreatedAt?: string | null
  onSave?: () => void
  onDelete?: () => void
  loading?: boolean
}

function renderSection(overrides: Overrides = {}) {
  const props = {
    review: null,
    reviewCreatedAt: null,
    onSave: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  }
  render(
    <ThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <ReviewSection {...props} />
      </StyledThemeProvider>
    </ThemeProvider>,
  )
  return props
}

test('typing a review and saving calls onSave with the trimmed text', async () => {
  const user = userEvent.setup()
  const { onSave } = renderSection()
  await user.type(screen.getByRole('textbox'), 'Ótimo jogo')
  await user.click(screen.getByRole('button', { name: texts.gameDetails.reviewSaveButton }))
  expect(onSave).toHaveBeenCalledWith('Ótimo jogo')
})

test('the save button is disabled while the field is empty', () => {
  renderSection()
  // sem texto, salvar não faz sentido: precisa estar desabilitado
  expect(screen.getByRole('button', { name: texts.gameDetails.reviewSaveButton })).toBeDisabled()
})

test('the character counter reflects what was typed', async () => {
  const user = userEvent.setup()
  renderSection()
  expect(screen.getByText('0/5000')).toBeInTheDocument()
  await user.type(screen.getByRole('textbox'), 'abcde')
  expect(screen.getByText('5/5000')).toBeInTheDocument()
})

test('with an existing review it shows the text, the creation date and the actions', () => {
  renderSection({ review: 'Meu texto', reviewCreatedAt: '2026-07-13T00:00:00Z' })
  expect(screen.getByText('Meu texto')).toBeInTheDocument()
  expect(screen.getByText(/escrita em 13\/07\/2026/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: texts.gameDetails.reviewEditButton })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: texts.gameDetails.reviewDeleteButton })).toBeInTheDocument()
  // no modo leitura não há editor
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
})

test('clicking edit reveals the editor pre-filled with the current review', async () => {
  const user = userEvent.setup()
  renderSection({ review: 'Texto atual', reviewCreatedAt: '2026-07-13T00:00:00Z' })
  await user.click(screen.getByRole('button', { name: texts.gameDetails.reviewEditButton }))
  expect(screen.getByRole('textbox')).toHaveValue('Texto atual')
})

test('deleting asks for confirmation before calling onDelete', async () => {
  const user = userEvent.setup()
  const { onDelete } = renderSection({ review: 'Meu texto', reviewCreatedAt: '2026-07-13T00:00:00Z' })

  await user.click(screen.getByRole('button', { name: texts.gameDetails.reviewDeleteButton }))
  // ainda não chamou: só abriu o diálogo de confirmação
  expect(onDelete).not.toHaveBeenCalled()

  const dialog = await screen.findByRole('dialog')
  await user.click(within(dialog).getByRole('button', { name: texts.gameDetails.reviewDeleteConfirmButton }))
  expect(onDelete).toHaveBeenCalledOnce()
})

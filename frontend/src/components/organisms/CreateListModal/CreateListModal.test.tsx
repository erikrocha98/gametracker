import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { CreateListModal } from './CreateListModal'
import { createList, updateList } from '../../../services/lists'
import { texts } from '../../../constants/texts'
import type { GameList } from '../../../types/list'

vi.mock('../../../services/lists', () => ({
  createList: vi.fn(),
  updateList: vi.fn(),
}))

const savedList: GameList = {
  id: 1,
  name: 'RPGs',
  description: 'favoritos',
  isPublic: false,
  createdAt: '2026-07-13T00:00:00Z',
  updatedAt: '2026-07-13T00:00:00Z',
  gameCount: 0,
  coverUrls: [],
}

function renderModal(props = {}) {
  const onClose = vi.fn()
  const onSaved = vi.fn()
  render(
    <ThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <CreateListModal open onClose={onClose} onSaved={onSaved} {...props} />
      </StyledThemeProvider>
    </ThemeProvider>,
  )
  return { onClose, onSaved }
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('renders create title when no list is provided', () => {
  renderModal()
  expect(screen.getByText(texts.myLists.modalCreateTitle)).toBeInTheDocument()
})

test('renders edit title and pre-fills fields when a list is provided', () => {
  renderModal({ list: savedList })
  expect(screen.getByText(texts.myLists.modalEditTitle)).toBeInTheDocument()
  expect(screen.getByPlaceholderText(texts.myLists.namePlaceholder)).toHaveValue('RPGs')
  expect(screen.getByPlaceholderText(texts.myLists.descriptionPlaceholder)).toHaveValue('favoritos')
})

test('shows validation error and does not submit when name is empty', async () => {
  const user = userEvent.setup()
  renderModal()
  await user.click(screen.getByRole('button', { name: texts.myLists.saveButton }))
  expect(await screen.findByRole('alert')).toHaveTextContent(texts.myLists.nameRequiredError)
  expect(createList).not.toHaveBeenCalled()
})

test('creates a list and notifies onSaved and onClose', async () => {
  const user = userEvent.setup()
  vi.mocked(createList).mockResolvedValue(savedList)
  const { onClose, onSaved } = renderModal()

  await user.type(screen.getByPlaceholderText(texts.myLists.namePlaceholder), 'RPGs')
  await user.type(screen.getByPlaceholderText(texts.myLists.descriptionPlaceholder), 'favoritos')
  await user.click(screen.getByRole('button', { name: texts.myLists.saveButton }))

  expect(await screen.findByText(texts.myLists.createSuccessMessage)).toBeInTheDocument()
  expect(createList).toHaveBeenCalledWith('RPGs', 'favoritos')
  expect(onSaved).toHaveBeenCalledWith(savedList)
  expect(onClose).toHaveBeenCalled()
})

test('updates the list when editing', async () => {
  const user = userEvent.setup()
  const updated = { ...savedList, name: 'RPGs 2026' }
  vi.mocked(updateList).mockResolvedValue(updated)
  const { onSaved } = renderModal({ list: savedList })

  const nameField = screen.getByPlaceholderText(texts.myLists.namePlaceholder)
  await user.clear(nameField)
  await user.type(nameField, 'RPGs 2026')
  await user.click(screen.getByRole('button', { name: texts.myLists.saveButton }))

  expect(await screen.findByText(texts.myLists.editSuccessMessage)).toBeInTheDocument()
  expect(updateList).toHaveBeenCalledWith(savedList.id, 'RPGs 2026', 'favoritos')
  expect(onSaved).toHaveBeenCalledWith(updated)
})

test('shows error feedback when creation fails', async () => {
  const user = userEvent.setup()
  vi.mocked(createList).mockRejectedValue(new Error('boom'))
  const { onSaved } = renderModal()

  await user.type(screen.getByPlaceholderText(texts.myLists.namePlaceholder), 'RPGs')
  await user.click(screen.getByRole('button', { name: texts.myLists.saveButton }))

  expect(await screen.findByText(texts.myLists.createErrorMessage)).toBeInTheDocument()
  expect(onSaved).not.toHaveBeenCalled()
})

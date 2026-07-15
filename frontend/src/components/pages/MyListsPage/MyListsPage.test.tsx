import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { MyListsPage } from './MyListsPage'
import { deleteList, getLists } from '../../../services/lists'
import { texts } from '../../../constants/texts'
import type { GameList } from '../../../types/list'

vi.mock('../../../services/lists', () => ({
  getLists: vi.fn(),
  createList: vi.fn(),
  updateList: vi.fn(),
  deleteList: vi.fn(),
}))

const list: GameList = {
  id: 1,
  name: 'RPGs',
  description: 'favoritos',
  isPublic: false,
  createdAt: '2026-07-13T00:00:00Z',
  updatedAt: '2026-07-13T00:00:00Z',
  gameCount: 0,
  coverUrls: [],
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <MyListsPage />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getLists).mockResolvedValue({ items: [] })
})

test('renders page title', async () => {
  renderPage()
  expect(await screen.findByText(texts.myLists.pageTitle)).toBeInTheDocument()
})

test('renders empty state when there are no lists', async () => {
  renderPage()
  expect(await screen.findByText(texts.myLists.emptyTitle)).toBeInTheDocument()
})

test('renders the lists returned by the service', async () => {
  vi.mocked(getLists).mockResolvedValue({ items: [list] })
  renderPage()
  expect(await screen.findByText('RPGs')).toBeInTheDocument()
})

test('renders error message when loading fails', async () => {
  vi.mocked(getLists).mockRejectedValue(new Error('boom'))
  renderPage()
  expect(await screen.findByText(texts.myLists.loadError)).toBeInTheDocument()
})

test('opens the create modal from the header button', async () => {
  const user = userEvent.setup()
  // com uma lista existente o empty state (que tem seu próprio botão "Criar lista")
  // não renderiza, deixando o botão do cabeçalho como alvo inequívoco
  vi.mocked(getLists).mockResolvedValue({ items: [list] })
  renderPage()
  await screen.findByText('RPGs')
  await user.click(screen.getByRole('button', { name: texts.myLists.createButton }))
  // o título do modal e o texto do botão são a mesma string ("Criar lista");
  // buscar por role separa o heading do dialog do button do cabeçalho
  expect(await screen.findByRole('heading', { name: texts.myLists.modalCreateTitle })).toBeInTheDocument()
})

test('deletes a list after confirming and shows success feedback', async () => {
  const user = userEvent.setup()
  vi.mocked(getLists).mockResolvedValue({ items: [list] })
  vi.mocked(deleteList).mockResolvedValue(undefined)
  renderPage()

  await screen.findByText('RPGs')
  await user.click(screen.getByRole('button', { name: texts.myLists.deleteAriaLabel }))

  // a exclusão só acontece após confirmar no diálogo
  expect(deleteList).not.toHaveBeenCalled()
  await user.click(await screen.findByRole('button', { name: texts.myLists.deleteConfirmButton }))

  expect(await screen.findByText(texts.myLists.deleteSuccessMessage)).toBeInTheDocument()
  expect(deleteList).toHaveBeenCalledWith(list.id)
  expect(screen.queryByText('RPGs')).not.toBeInTheDocument()
})

test('does not delete the list when the confirmation is cancelled', async () => {
  const user = userEvent.setup()
  vi.mocked(getLists).mockResolvedValue({ items: [list] })
  renderPage()

  await screen.findByText('RPGs')
  await user.click(screen.getByRole('button', { name: texts.myLists.deleteAriaLabel }))
  await user.click(await screen.findByRole('button', { name: texts.myLists.deleteCancelButton }))

  expect(deleteList).not.toHaveBeenCalled()
  expect(screen.getByText('RPGs')).toBeInTheDocument()
})

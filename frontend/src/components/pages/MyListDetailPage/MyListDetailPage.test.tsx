import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { MyListDetailPage } from './MyListDetailPage'
import { getLists } from '../../../services/lists'
import { texts } from '../../../constants/texts'
import type { GameList } from '../../../types/list'

vi.mock('../../../services/lists', () => ({
  getLists: vi.fn(),
}))

const list: GameList = {
  id: 7,
  name: 'RPGs favoritos',
  description: 'os melhores rpgs',
  isPublic: false,
  createdAt: '2026-07-13T00:00:00Z',
  updatedAt: '2026-07-13T00:00:00Z',
}

function renderAt(listId: number) {
  render(
    <MemoryRouter initialEntries={[`/my-lists/${listId}`]}>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <Routes>
            <Route path="/my-lists/:listId" element={<MyListDetailPage />} />
          </Routes>
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('renders the list name and description', async () => {
  vi.mocked(getLists).mockResolvedValue({ items: [list] })
  renderAt(list.id)
  expect(await screen.findByRole('heading', { name: list.name })).toBeInTheDocument()
  expect(screen.getByText('os melhores rpgs')).toBeInTheDocument()
})

test('shows the empty games state while lists have no games yet', async () => {
  vi.mocked(getLists).mockResolvedValue({ items: [list] })
  renderAt(list.id)
  expect(await screen.findByText(texts.myLists.detailGamesEmptyTitle)).toBeInTheDocument()
})

test('shows a not-found state when the list does not exist', async () => {
  vi.mocked(getLists).mockResolvedValue({ items: [list] })
  renderAt(999)
  expect(await screen.findByText(texts.myLists.detailNotFoundTitle)).toBeInTheDocument()
})

test('shows an error message when loading fails', async () => {
  vi.mocked(getLists).mockRejectedValue(new Error('boom'))
  renderAt(list.id)
  expect(await screen.findByText(texts.myLists.detailLoadError)).toBeInTheDocument()
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { MyListDetailPage } from './MyListDetailPage'
import { getList, removeGameFromList } from '../../../services/lists'
import { texts } from '../../../constants/texts'
import type { GameListDetail } from '../../../types/list'

vi.mock('../../../services/lists', () => ({
  getList: vi.fn(),
  removeGameFromList: vi.fn(),
}))

const detail: GameListDetail = {
  id: 7,
  name: 'RPGs favoritos',
  description: 'os melhores rpgs',
  isPublic: false,
  createdAt: '2026-07-13T00:00:00Z',
  updatedAt: '2026-07-13T00:00:00Z',
  gameCount: 2,
  coverUrls: [],
  items: [
    { gameId: 'zelda', name: 'Zelda', coverUrl: null, platforms: ['Switch'], releaseYear: 2017, addedAt: '2026-07-13T00:00:00Z' },
    { gameId: 'mario', name: 'Mario', coverUrl: null, platforms: ['Switch'], releaseYear: 2017, addedAt: '2026-07-12T00:00:00Z' },
  ],
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

test('fetches the list by id and renders its name, description and games', async () => {
  vi.mocked(getList).mockResolvedValue(detail)
  renderAt(detail.id)
  expect(await screen.findByRole('heading', { name: detail.name })).toBeInTheDocument()
  expect(screen.getByText('os melhores rpgs')).toBeInTheDocument()
  expect(screen.getByText('Zelda')).toBeInTheDocument()
  expect(getList).toHaveBeenCalledWith(detail.id)
})

test('shows the empty games state when the list has no games', async () => {
  vi.mocked(getList).mockResolvedValue({ ...detail, items: [] })
  renderAt(detail.id)
  expect(await screen.findByText(texts.myLists.detailGamesEmptyTitle)).toBeInTheDocument()
})

test('removes a game and shows success feedback', async () => {
  const user = userEvent.setup()
  vi.mocked(getList).mockResolvedValue(detail)
  vi.mocked(removeGameFromList).mockResolvedValue(undefined)
  renderAt(detail.id)

  await screen.findByText('Zelda')
  await user.click(screen.getAllByRole('button', { name: texts.myLists.removeGameAriaLabel })[0])

  expect(removeGameFromList).toHaveBeenCalledWith(detail.id, 'zelda')
  expect(await screen.findByText(texts.myLists.removeGameSuccessMessage)).toBeInTheDocument()
  expect(screen.queryByText('Zelda')).not.toBeInTheDocument()
})

test('shows an error feedback when removal fails', async () => {
  const user = userEvent.setup()
  vi.mocked(getList).mockResolvedValue(detail)
  vi.mocked(removeGameFromList).mockRejectedValue(new Error('boom'))
  renderAt(detail.id)

  await screen.findByText('Zelda')
  await user.click(screen.getAllByRole('button', { name: texts.myLists.removeGameAriaLabel })[0])

  expect(await screen.findByText(texts.myLists.removeGameErrorMessage)).toBeInTheDocument()
  expect(screen.getByText('Zelda')).toBeInTheDocument()
})

test('shows a not-found state when the list does not exist', async () => {
  vi.mocked(getList).mockRejectedValue(new Response(null, { status: 404 }))
  renderAt(999)
  expect(await screen.findByText(texts.myLists.detailNotFoundTitle)).toBeInTheDocument()
})

test('shows an error message when loading fails', async () => {
  vi.mocked(getList).mockRejectedValue(new Error('boom'))
  renderAt(detail.id)
  expect(await screen.findByText(texts.myLists.detailLoadError)).toBeInTheDocument()
})

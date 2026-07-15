import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { AddToListDialog } from './AddToListDialog'
import { addGameToList, getLists } from '../../../services/lists'
import { texts } from '../../../constants/texts'
import type { GameList } from '../../../types/list'

vi.mock('../../../services/lists', () => ({
  getLists: vi.fn(),
  addGameToList: vi.fn(),
}))

const baseList = {
  description: null,
  isPublic: false,
  createdAt: '2026-07-13T00:00:00Z',
  updatedAt: '2026-07-13T00:00:00Z',
  coverUrls: [],
}

const lists: GameList[] = [
  { ...baseList, id: 1, name: 'Favoritos', gameCount: 3, containsGame: false },
  { ...baseList, id: 2, name: 'Já tenho', gameCount: 5, containsGame: true },
  // o nome não pode colidir com o label "Lista cheia" exibido pelo componente
  { ...baseList, id: 3, name: 'Backlog gigante', gameCount: 50, containsGame: false },
]

const GAME_ID = 'rawg-3498'

function renderDialog(props = {}) {
  const onClose = vi.fn()
  const onAdded = vi.fn()
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <AddToListDialog open gameId={GAME_ID} onClose={onClose} onAdded={onAdded} {...props} />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
  return { onClose, onAdded }
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('lists returned by the service are shown once loaded', async () => {
  vi.mocked(getLists).mockResolvedValue({ items: lists })
  renderDialog()
  expect(await screen.findByRole('button', { name: /Favoritos/ })).toBeInTheDocument()
  expect(getLists).toHaveBeenCalledWith(GAME_ID)
})

test('marks a list that already contains the game as added and disabled', async () => {
  vi.mocked(getLists).mockResolvedValue({ items: lists })
  renderDialog()
  expect(await screen.findByText(texts.addToList.alreadyInListLabel)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Já tenho/ })).toHaveAttribute('aria-disabled', 'true')
})

test('disables a full list and shows the full label', async () => {
  vi.mocked(getLists).mockResolvedValue({ items: lists })
  renderDialog()
  expect(await screen.findByText(texts.addToList.listFullLabel)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Backlog gigante/ })).toHaveAttribute('aria-disabled', 'true')
})

test('adds the game to a list and shows success feedback', async () => {
  const user = userEvent.setup()
  vi.mocked(getLists).mockResolvedValue({ items: lists })
  vi.mocked(addGameToList).mockResolvedValue({
    gameId: GAME_ID,
    name: 'GTA V',
    coverUrl: null,
    platforms: [],
    releaseYear: null,
    addedAt: '2026-07-15T00:00:00Z',
  })
  const { onAdded } = renderDialog()

  await user.click(await screen.findByRole('button', { name: /Favoritos/ }))

  expect(addGameToList).toHaveBeenCalledWith(1, GAME_ID)
  expect(await screen.findByText(texts.addToList.successMessage)).toBeInTheDocument()
  expect(onAdded).toHaveBeenCalledOnce()
})

test('shows the already-in-list error when the API answers 409', async () => {
  const user = userEvent.setup()
  vi.mocked(getLists).mockResolvedValue({ items: lists })
  vi.mocked(addGameToList).mockRejectedValue(new Response(null, { status: 409 }))
  renderDialog()

  await user.click(await screen.findByRole('button', { name: /Favoritos/ }))

  expect(await screen.findByText(texts.addToList.alreadyInListError)).toBeInTheDocument()
})

test('shows the empty state with a CTA that navigates to my lists', async () => {
  const user = userEvent.setup()
  vi.mocked(getLists).mockResolvedValue({ items: [] })
  render(
    <MemoryRouter initialEntries={['/']}>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <Routes>
            <Route path="/" element={<AddToListDialog open gameId={GAME_ID} onClose={vi.fn()} />} />
            <Route path="/my-lists" element={<div>lists landing</div>} />
          </Routes>
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )

  await user.click(await screen.findByRole('button', { name: texts.addToList.createListCta }))
  expect(await screen.findByText('lists landing')).toBeInTheDocument()
})

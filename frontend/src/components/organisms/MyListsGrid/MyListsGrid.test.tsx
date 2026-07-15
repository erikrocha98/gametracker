import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { MyListsGrid } from './MyListsGrid'
import { texts } from '../../../constants/texts'
import type { GameList } from '../../../types/list'

const items: GameList[] = [
  { id: 1, name: 'RPGs', description: 'favoritos', isPublic: false, createdAt: '2026-07-13T00:00:00Z', updatedAt: '2026-07-13T00:00:00Z' },
  { id: 2, name: 'Zerados em 2025', description: null, isPublic: false, createdAt: '2026-07-12T00:00:00Z', updatedAt: '2026-07-12T00:00:00Z' },
]

function renderGrid(props = {}) {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const onCreate = vi.fn()
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <MyListsGrid
            items={items}
            loading={false}
            error={false}
            onEdit={onEdit}
            onDelete={onDelete}
            onCreate={onCreate}
            {...props}
          />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
  return { onEdit, onDelete, onCreate }
}

test('renders one card per list', () => {
  renderGrid()
  expect(screen.getByText('RPGs')).toBeInTheDocument()
  expect(screen.getByText('Zerados em 2025')).toBeInTheDocument()
})

test('renders loading state', () => {
  renderGrid({ loading: true })
  expect(screen.getByRole('progressbar')).toBeInTheDocument()
})

test('renders error message', () => {
  renderGrid({ error: true })
  expect(screen.getByText(texts.myLists.loadError)).toBeInTheDocument()
})

test('renders empty state and triggers onCreate from its action', async () => {
  const user = userEvent.setup()
  const { onCreate } = renderGrid({ items: [] })
  expect(screen.getByText(texts.myLists.emptyTitle)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: texts.myLists.createButton }))
  expect(onCreate).toHaveBeenCalledOnce()
})

test('forwards the clicked list to onEdit and onDelete', async () => {
  const user = userEvent.setup()
  const { onEdit, onDelete } = renderGrid()
  await user.click(screen.getAllByRole('button', { name: texts.myLists.editAriaLabel })[0])
  expect(onEdit).toHaveBeenCalledWith(items[0])
  await user.click(screen.getAllByRole('button', { name: texts.myLists.deleteAriaLabel })[1])
  expect(onDelete).toHaveBeenCalledWith(items[1])
})

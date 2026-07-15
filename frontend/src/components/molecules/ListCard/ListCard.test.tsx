import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { ListCard } from './ListCard'
import { texts } from '../../../constants/texts'
import type { GameList } from '../../../types/list'

const list: GameList = {
  id: 1,
  name: 'RPGs favoritos',
  description: 'Meus RPGs preferidos de todos os tempos',
  isPublic: false,
  createdAt: '2026-07-13T00:00:00Z',
  updatedAt: '2026-07-13T00:00:00Z',
}

function renderCard(props = {}) {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <ListCard list={list} onEdit={onEdit} onDelete={onDelete} {...props} />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
  return { onEdit, onDelete }
}

test('renders list name and description', () => {
  renderCard()
  expect(screen.getByText('RPGs favoritos')).toBeInTheDocument()
  expect(screen.getByText('Meus RPGs preferidos de todos os tempos')).toBeInTheDocument()
})

test('does not render description when it is null', () => {
  renderCard({ list: { ...list, description: null } })
  expect(screen.queryByText('Meus RPGs preferidos de todos os tempos')).not.toBeInTheDocument()
})

test('calls onEdit when the edit action is clicked', async () => {
  const user = userEvent.setup()
  const { onEdit } = renderCard()
  await user.click(screen.getByRole('button', { name: texts.myLists.editAriaLabel }))
  expect(onEdit).toHaveBeenCalledOnce()
})

test('calls onDelete when the delete action is clicked', async () => {
  const user = userEvent.setup()
  const { onDelete } = renderCard()
  await user.click(screen.getByRole('button', { name: texts.myLists.deleteAriaLabel }))
  expect(onDelete).toHaveBeenCalledOnce()
})

test('links to the list detail page', () => {
  renderCard()
  expect(screen.getByRole('link', { name: new RegExp(list.name, 'i') })).toHaveAttribute(
    'href',
    `/my-lists/${list.id}`,
  )
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { ListGamesGrid } from './ListGamesGrid'
import { texts } from '../../../constants/texts'
import type { ListGame } from '../../../types/list'

const items: ListGame[] = [
  { gameId: 'zelda', name: 'Zelda', coverUrl: null, platforms: ['Switch'], releaseYear: 2017, addedAt: '2026-07-13T00:00:00Z' },
  { gameId: 'mario', name: 'Mario', coverUrl: null, platforms: ['Switch'], releaseYear: 2017, addedAt: '2026-07-12T00:00:00Z' },
]

function renderGrid(props = {}) {
  const onRemove = vi.fn()
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <ListGamesGrid items={items} onRemove={onRemove} {...props} />
        </StyledThemeProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
  return { onRemove }
}

test('renders one card per game', () => {
  renderGrid()
  expect(screen.getByText('Zelda')).toBeInTheDocument()
  expect(screen.getByText('Mario')).toBeInTheDocument()
})

test('renders the empty state when there are no games', () => {
  renderGrid({ items: [] })
  expect(screen.getByText(texts.myLists.detailGamesEmptyTitle)).toBeInTheDocument()
})

test('forwards the clicked game to onRemove', async () => {
  const user = userEvent.setup()
  const { onRemove } = renderGrid()
  await user.click(screen.getAllByRole('button', { name: texts.myLists.removeGameAriaLabel })[1])
  expect(onRemove).toHaveBeenCalledWith('mario')
})

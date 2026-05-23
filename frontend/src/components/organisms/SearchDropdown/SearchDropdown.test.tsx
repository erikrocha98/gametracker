import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { MemoryRouter } from 'react-router-dom'
import { theme } from '../../../theme/theme'
import { SearchDropdown } from './SearchDropdown'
import type { GameSearchResult } from '../../../types/game'

const RESULTS: GameSearchResult[] = [
  { id: 'rawg-1', name: 'Zelda', coverUrl: null, platforms: [], releaseYear: 2017 },
]

function renderDropdown(props: Parameters<typeof SearchDropdown>[0]) {
  return render(
    <MemoryRouter>
      <MuiThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <SearchDropdown {...props} />
        </StyledThemeProvider>
      </MuiThemeProvider>
    </MemoryRouter>,
  )
}

const base = { results: [], onSelect: vi.fn(), onRetry: vi.fn() }

test('renders nothing when status is idle', () => {
  const { container } = renderDropdown({ ...base, status: 'idle' })
  expect(container).toBeEmptyDOMElement()
})

test('renders loading message when status is loading', () => {
  renderDropdown({ ...base, status: 'loading' })
  expect(screen.getByText('Buscando...')).toBeInTheDocument()
})

test('renders no results message when status is empty', () => {
  renderDropdown({ ...base, status: 'empty' })
  expect(screen.getByText('Nenhum jogo encontrado.')).toBeInTheDocument()
})

test('renders error message with retry when status is error', () => {
  renderDropdown({ ...base, status: 'error' })
  expect(screen.getByText(/Erro ao buscar jogos/)).toBeInTheDocument()
  expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
})

test('calls onRetry when retry button is clicked', async () => {
  const onRetry = vi.fn()
  renderDropdown({ ...base, status: 'error', onRetry })
  await userEvent.click(screen.getByText('Tentar novamente'))
  expect(onRetry).toHaveBeenCalled()
})

test('renders results when status is success', () => {
  renderDropdown({ ...base, status: 'success', results: RESULTS })
  expect(screen.getByText('Zelda')).toBeInTheDocument()
})

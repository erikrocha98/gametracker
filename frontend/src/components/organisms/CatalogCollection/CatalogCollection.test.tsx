import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { CatalogCollection } from './CatalogCollection'
import type { CollectionGame } from '../../../types/game'
import type { ActivityFilterValue } from '../../molecules/ActivityFilters'

const GAMES: CollectionGame[] = [
  { id: 1, gameId: 'rawg-1', name: 'Zelda', coverUrl: null, platforms: [], releaseYear: 2017, rating: null, status: 'want_to_play' },
]

function renderCollection(
  props: Omit<Parameters<typeof CatalogCollection>[0], 'filter' | 'onFilterChange'> & {
    filter?: ActivityFilterValue
    onFilterChange?: (v: ActivityFilterValue) => void
  },
) {
  return render(
    <MemoryRouter>
      <MuiThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <CatalogCollection
            filter={props.filter ?? 'added'}
            onFilterChange={props.onFilterChange ?? (() => {})}
            {...props}
          />
        </StyledThemeProvider>
      </MuiThemeProvider>
    </MemoryRouter>,
  )
}

test('shows section title Atividade Recente', () => {
  renderCollection({ items: [], loading: false, error: false })
  expect(screen.getByText('Atividade Recente')).toBeInTheDocument()
})

test('shows all three activity filter tabs', () => {
  renderCollection({ items: [], loading: false, error: false })
  expect(screen.getByText('Jogos adicionados')).toBeInTheDocument()
  expect(screen.getByText('Finalizados')).toBeInTheDocument()
  expect(screen.getByText('Reviews')).toBeInTheDocument()
})

test('does not show add game button', () => {
  renderCollection({ items: [], loading: false, error: false })
  expect(screen.queryByText('Adicionar jogo')).not.toBeInTheDocument()
})

test('shows loading spinner when loading', () => {
  renderCollection({ items: [], loading: true, error: false })
  expect(screen.getByRole('progressbar')).toBeInTheDocument()
})

test('shows error message when error occurs', () => {
  renderCollection({ items: [], loading: false, error: true })
  expect(screen.getByText('Não foi possível carregar sua coleção.')).toBeInTheDocument()
})

test('shows empty state when no items', () => {
  renderCollection({ items: [], loading: false, error: false })
  expect(screen.getByText('Nenhuma atividade ainda')).toBeInTheDocument()
})

test('shows game cards when items exist', () => {
  renderCollection({ items: GAMES, loading: false, error: false })
  expect(screen.getByText('Zelda')).toBeInTheDocument()
})

test('shows item count', () => {
  renderCollection({ items: GAMES, loading: false, error: false })
  expect(screen.getByText(/1 jogos/)).toBeInTheDocument()
})

test('calls onFilterChange when a tab is clicked', () => {
  const onFilterChange = vi.fn()
  renderCollection({ items: [], loading: false, error: false, onFilterChange })
  fireEvent.click(screen.getByText('Finalizados'))
  expect(onFilterChange).toHaveBeenCalledWith('finished')
})

test('shows add action on added tab, not on finished tab', () => {
  const { rerender } = render(
    <MemoryRouter>
      <MuiThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <CatalogCollection items={[]} loading={false} error={false} filter="added" onFilterChange={() => {}} />
        </StyledThemeProvider>
      </MuiThemeProvider>
    </MemoryRouter>,
  )
  expect(screen.getByText('Adicionar')).toBeInTheDocument()

  rerender(
    <MemoryRouter>
      <MuiThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <CatalogCollection items={[]} loading={false} error={false} filter="finished" onFilterChange={() => {}} />
        </StyledThemeProvider>
      </MuiThemeProvider>
    </MemoryRouter>,
  )
  expect(screen.queryByText('Adicionar jogo')).not.toBeInTheDocument()
})

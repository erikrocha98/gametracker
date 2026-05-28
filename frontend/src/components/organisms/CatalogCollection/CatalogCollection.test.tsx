import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { CatalogCollection } from './CatalogCollection'
import type { CollectionGame } from '../../../types/game'

const GAMES: CollectionGame[] = [
  { id: 1, gameId: 'rawg-1', name: 'Zelda', coverUrl: null, platforms: [], releaseYear: 2017 },
]

function renderCollection(props: Parameters<typeof CatalogCollection>[0]) {
  return render(
    <MemoryRouter>
      <MuiThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <CatalogCollection {...props} />
        </StyledThemeProvider>
      </MuiThemeProvider>
    </MemoryRouter>,
  )
}

test('shows section title ATIVIDADE RECENTE', () => {
  renderCollection({ items: [], loading: false, error: false })
  expect(screen.getByText('ATIVIDADE RECENTE')).toBeInTheDocument()
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

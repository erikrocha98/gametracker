import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import type { GameStatus } from '../../../types/game'
import { GameCardMenu } from './GameCardMenu'

function renderMenu(
  rating: number | null = null,
  onRate = vi.fn(),
  onDelete = vi.fn(),
  onStatusChange = vi.fn(),
  status: GameStatus = 'want_to_play',
  onAddToList: (() => void) | undefined = undefined,
) {
  render(
    <MuiThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <GameCardMenu
          status={status}
          rating={rating}
          onStatusChange={onStatusChange}
          onRate={onRate}
          onDelete={onDelete}
          onAddToList={onAddToList}
        />
      </StyledThemeProvider>
    </MuiThemeProvider>,
  )
  return { onRate, onDelete, onStatusChange, onAddToList }
}

async function openMenu() {
  await userEvent.click(screen.getByRole('button', { name: /opções do jogo/i }))
}

test('menu options are hidden until the trigger is clicked', () => {
  renderMenu()
  // queryBy: afirmando que ainda NÃO está na tela antes da interação
  expect(screen.queryByText('Deletar')).not.toBeInTheDocument()
})

test('clicking the "Jogando" option changes the status to playing', async () => {
  const { onStatusChange } = renderMenu()
  await openMenu()
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Jogando' }))
  expect(onStatusChange).toHaveBeenCalledWith('playing')
})

test('clicking the "Jogado" option changes the status to finished', async () => {
  const { onStatusChange } = renderMenu()
  await openMenu()
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Jogado' }))
  expect(onStatusChange).toHaveBeenCalledWith('finished')
})

test('clicking delete calls onDelete', async () => {
  const { onDelete } = renderMenu()
  await openMenu()
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Deletar' }))
  expect(onDelete).toHaveBeenCalledOnce()
})

test('the review option is disabled when no callback is provided', async () => {
  renderMenu()
  await openMenu()
  expect(await screen.findByRole('menuitem', { name: 'Adicionar review' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
})

test('the add-to-list option is disabled when no callback is provided', async () => {
  renderMenu()
  await openMenu()
  expect(await screen.findByRole('menuitem', { name: 'Adicionar à lista' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
})

test('the add-to-list option is enabled and calls onAddToList when provided', async () => {
  const onAddToList = vi.fn()
  renderMenu(null, vi.fn(), vi.fn(), vi.fn(), 'want_to_play', onAddToList)
  await openMenu()
  const item = await screen.findByRole('menuitem', { name: 'Adicionar à lista' })
  expect(item).not.toHaveAttribute('aria-disabled', 'true')
  await userEvent.click(item)
  expect(onAddToList).toHaveBeenCalledOnce()
})

test('remove-rating action is offered only when a rating exists', async () => {
  renderMenu(4)
  await openMenu()
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Dar uma nota' }))
  // findBy: o diálogo abre com transição, então esperamos ele aparecer
  expect(await screen.findByRole('button', { name: 'Remover nota' })).toBeInTheDocument()
})

test('removing a rating calls onRate with null', async () => {
  const { onRate } = renderMenu(4)
  await openMenu()
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Dar uma nota' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Remover nota' }))
  expect(onRate).toHaveBeenCalledWith(null)
})

test('rating dialog has no remove action when there is no rating yet', async () => {
  renderMenu(null)
  await openMenu()
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Dar uma nota' }))
  // o diálogo abriu (botão Fechar presente) mas sem opção de remover
  expect(await screen.findByRole('button', { name: 'Fechar' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Remover nota' })).not.toBeInTheDocument()
})

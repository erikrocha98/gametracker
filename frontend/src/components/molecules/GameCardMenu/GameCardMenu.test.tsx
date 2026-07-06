import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { GameCardMenu } from './GameCardMenu'

function renderMenu(rating: number | null = null, onRate = vi.fn(), onDelete = vi.fn()) {
  render(
    <MuiThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <GameCardMenu rating={rating} onRate={onRate} onDelete={onDelete} />
      </StyledThemeProvider>
    </MuiThemeProvider>,
  )
  return { onRate, onDelete }
}

async function openMenu() {
  await userEvent.click(screen.getByRole('button', { name: /opções do jogo/i }))
}

test('menu options are hidden until the trigger is clicked', () => {
  renderMenu()
  // queryBy: afirmando que ainda NÃO está na tela antes da interação
  expect(screen.queryByText('Deletar')).not.toBeInTheDocument()
})

test('clicking delete calls onDelete', async () => {
  const { onDelete } = renderMenu()
  await openMenu()
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Deletar' }))
  expect(onDelete).toHaveBeenCalledOnce()
})

test('review and add-to-list options are disabled', async () => {
  renderMenu()
  await openMenu()
  expect(await screen.findByRole('menuitem', { name: 'Adicionar review' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
  expect(screen.getByRole('menuitem', { name: 'Adicionar à lista' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
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

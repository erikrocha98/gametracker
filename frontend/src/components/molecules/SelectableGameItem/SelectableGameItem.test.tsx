import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { SelectableGameItem } from './SelectableGameItem'
import type { GameSearchResult } from '../../../types/game'

const mockResult: GameSearchResult = {
  id: 'game-1',
  name: 'The Legend of Zelda',
  coverUrl: null,
  platforms: ['Nintendo Switch', 'Wii U'],
  releaseYear: 2017,
}

function renderItem(onClick = vi.fn()) {
  return render(
    <ThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <SelectableGameItem result={mockResult} onClick={onClick} />
      </StyledThemeProvider>
    </ThemeProvider>,
  )
}

test('renders game name', () => {
  renderItem()
  expect(screen.getByText('The Legend of Zelda')).toBeInTheDocument()
})

test('renders platform and year metadata', () => {
  renderItem()
  expect(screen.getByText(/Nintendo Switch/)).toBeInTheDocument()
  expect(screen.getByText(/2017/)).toBeInTheDocument()
})

test('calls onClick when clicked', async () => {
  const onClick = vi.fn()
  renderItem(onClick)
  await userEvent.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalledTimes(1)
})

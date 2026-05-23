import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { SearchResultItem } from './SearchResultItem'
import type { GameSearchResult } from '../../../types/game'

const RESULT: GameSearchResult = {
  id: 'rawg-1',
  name: 'The Legend of Zelda',
  coverUrl: 'https://example.com/cover.jpg',
  platforms: ['Nintendo Switch', 'Wii U'],
  releaseYear: 2017,
}

function renderItem(result = RESULT, onClick = vi.fn()) {
  return render(
    <MuiThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <SearchResultItem result={result} onClick={onClick} />
      </StyledThemeProvider>
    </MuiThemeProvider>,
  )
}

test('renders game name', () => {
  renderItem()
  expect(screen.getByText('The Legend of Zelda')).toBeInTheDocument()
})

test('renders release year', () => {
  renderItem()
  expect(screen.getByText(/2017/)).toBeInTheDocument()
})

test('renders — when year is null', () => {
  renderItem({ ...RESULT, releaseYear: null })
  expect(screen.getByText(/—/)).toBeInTheDocument()
})

test('calls onClick when clicked', async () => {
  const onClick = vi.fn()
  renderItem(RESULT, onClick)
  await userEvent.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalled()
})

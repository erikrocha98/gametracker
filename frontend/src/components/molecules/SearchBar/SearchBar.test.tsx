import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { SearchBar } from './SearchBar'

function renderSearchBar(value = '', onChange = vi.fn(), onClear = vi.fn()) {
  return render(
    <MuiThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <SearchBar value={value} onChange={onChange} onClear={onClear} />
      </StyledThemeProvider>
    </MuiThemeProvider>,
  )
}

test('calls onChange when user types', async () => {
  const onChange = vi.fn()
  renderSearchBar('', onChange)
  await userEvent.type(screen.getByRole('textbox'), 'g')
  expect(onChange).toHaveBeenCalledWith('g')
})

test('shows clear button when value is non-empty', () => {
  renderSearchBar('zelda')
  expect(screen.getByLabelText('Limpar busca')).toBeInTheDocument()
})

test('hides clear button when value is empty', () => {
  renderSearchBar('')
  expect(screen.queryByLabelText('Limpar busca')).toBeNull()
})

test('calls onClear when clear button is clicked', async () => {
  const onClear = vi.fn()
  renderSearchBar('zelda', vi.fn(), onClear)
  await userEvent.click(screen.getByLabelText('Limpar busca'))
  expect(onClear).toHaveBeenCalled()
})

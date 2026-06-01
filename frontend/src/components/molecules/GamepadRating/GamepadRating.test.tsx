import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { GamepadRating } from './GamepadRating'

function renderRating(props: Parameters<typeof GamepadRating>[0]) {
  return render(
    <MuiThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <GamepadRating {...props} />
      </StyledThemeProvider>
    </MuiThemeProvider>,
  )
}

test('renders with a full rating value', () => {
  renderRating({ value: 4 })
  const checked = screen.getByRole('radio', { name: '4 Stars' }) as HTMLInputElement
  expect(checked.checked).toBe(true)
})

test('renders in readOnly mode without interaction', () => {
  renderRating({ value: 3.5, readOnly: true })
  const rating = screen.queryByRole('radio')
  expect(rating).toBeNull()
})

test('calls onChange when a rating is selected', () => {
  const handleChange = vi.fn()
  renderRating({ value: null, onChange: handleChange })
  const radios = screen.getAllByRole('radio')
  fireEvent.click(radios[4])
  expect(handleChange).toHaveBeenCalled()
})

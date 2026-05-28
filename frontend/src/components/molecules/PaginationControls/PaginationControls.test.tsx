import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { PaginationControls } from './PaginationControls'
import { texts } from '../../../constants/texts'

function renderControls(overrides = {}) {
  const onPageChange = vi.fn()
  const onPageSizeChange = vi.fn()
  render(
    <ThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <PaginationControls
          page={1}
          pageSize={10}
          totalItems={30}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          {...overrides}
        />
      </StyledThemeProvider>
    </ThemeProvider>,
  )
  return { onPageChange, onPageSizeChange }
}

test('renders per page label', () => {
  renderControls()
  expect(screen.getByText(texts.myGames.perPageLabel)).toBeInTheDocument()
})

test('renders page size toggle buttons', () => {
  renderControls()
  expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '15' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument()
})

test('calls onPageSizeChange when a size button is clicked', async () => {
  const { onPageSizeChange } = renderControls()
  await userEvent.click(screen.getByRole('button', { name: '5' }))
  expect(onPageSizeChange).toHaveBeenCalledWith(5)
})

test('calls onPageChange when pagination item is clicked', async () => {
  const { onPageChange } = renderControls({ totalItems: 30, pageSize: 10 })
  await userEvent.click(screen.getByRole('button', { name: 'Go to page 2' }))
  expect(onPageChange).toHaveBeenCalledWith(2)
})

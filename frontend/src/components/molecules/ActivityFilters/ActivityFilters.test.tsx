import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../../../theme/theme'
import { ActivityFilters } from './ActivityFilters'
import type { ActivityFilterValue } from './ActivityFilters'

function renderActivityFilters(value: ActivityFilterValue, onChange = vi.fn()) {
  return render(
    <ThemeProvider theme={theme}>
      <ActivityFilters value={value} onChange={onChange} />
    </ThemeProvider>,
  )
}

test('renders all three filter tabs', () => {
  renderActivityFilters('added')
  expect(screen.getByText('Jogos adicionados')).toBeInTheDocument()
  expect(screen.getByText('Finalizados')).toBeInTheDocument()
  expect(screen.getByText('Reviews')).toBeInTheDocument()
})

test('calls onChange with correct value when clicking a tab', async () => {
  const onChange = vi.fn()
  renderActivityFilters('added', onChange)
  await userEvent.click(screen.getByText('Finalizados'))
  expect(onChange).toHaveBeenCalledWith('finished')
})

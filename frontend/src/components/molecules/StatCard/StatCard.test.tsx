import { render, screen } from '@testing-library/react'
import { StatCard } from './StatCard'

test('renders the value and label passed as props', () => {
  render(<StatCard value={12} label="Jogos avaliados" icon={<span>icon</span>} />)
  expect(screen.getByText('12')).toBeInTheDocument()
  expect(screen.getByText('Jogos avaliados')).toBeInTheDocument()
})

test('renders the provided icon', () => {
  render(<StatCard value={0} label="Reviews" icon={<span>my-icon</span>} />)
  expect(screen.getByText('my-icon')).toBeInTheDocument()
})

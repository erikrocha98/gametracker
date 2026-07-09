import { render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'

test('shows the first letter as initial for a single-word username', () => {
  render(<Avatar username="erik" />)
  expect(screen.getByText('E')).toBeInTheDocument()
})

test('derives two initials from an underscore-separated username', () => {
  render(<Avatar username="erik_rocha" />)
  expect(screen.getByText('ER')).toBeInTheDocument()
})

test('uppercases the initials regardless of username casing', () => {
  render(<Avatar username="john doe" />)
  expect(screen.getByText('JD')).toBeInTheDocument()
})

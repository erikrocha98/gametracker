import { render, screen } from '@testing-library/react'
import { ProfileStats } from './ProfileStats'
import { texts } from '../../../constants/texts'

test('renders the rated-games value and each stat label', () => {
  render(<ProfileStats gamesRated={7} />)

  expect(screen.getByText('7')).toBeInTheDocument()
  expect(screen.getByText(texts.profile.gamesRatedLabel)).toBeInTheDocument()
  expect(screen.getByText(texts.profile.reviewsLabel)).toBeInTheDocument()
  expect(screen.getByText(texts.profile.listsLabel)).toBeInTheDocument()
})

test('marks reviews and lists as coming soon', () => {
  render(<ProfileStats gamesRated={0} />)

  // reviews e listas ainda não existem: ambos exibem o selo "Em breve"
  expect(screen.getAllByText(texts.profile.comingSoon)).toHaveLength(2)
})

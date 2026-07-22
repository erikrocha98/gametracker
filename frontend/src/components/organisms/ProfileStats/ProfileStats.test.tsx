import { render, screen } from '@testing-library/react'
import { ProfileStats } from './ProfileStats'
import { texts } from '../../../constants/texts'

test('renders the rated-games value and each stat label', () => {
  render(<ProfileStats gamesRated={7} reviewsCount={0} listsCount={0} />)

  expect(screen.getByText('7')).toBeInTheDocument()
  expect(screen.getByText(texts.profile.gamesRatedLabel)).toBeInTheDocument()
  expect(screen.getByText(texts.profile.reviewsLabel)).toBeInTheDocument()
  expect(screen.getByText(texts.profile.listsLabel)).toBeInTheDocument()
})

test('renders the number of reviews', () => {
  render(<ProfileStats gamesRated={0} reviewsCount={4} listsCount={0} />)

  const reviewsValue = screen.getByText(texts.profile.reviewsLabel).previousElementSibling
  expect(reviewsValue).toHaveTextContent('4')
})

test('renders the number of lists', () => {
  render(<ProfileStats gamesRated={0} reviewsCount={0} listsCount={3} />)

  const listsValue = screen.getByText(texts.profile.listsLabel).previousElementSibling
  expect(listsValue).toHaveTextContent('3')
})

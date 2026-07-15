import { render, screen } from '@testing-library/react'
import { ProfileStats } from './ProfileStats'
import { texts } from '../../../constants/texts'

test('renders the rated-games value and each stat label', () => {
  render(<ProfileStats gamesRated={7} listsCount={0} />)

  expect(screen.getByText('7')).toBeInTheDocument()
  expect(screen.getByText(texts.profile.gamesRatedLabel)).toBeInTheDocument()
  expect(screen.getByText(texts.profile.reviewsLabel)).toBeInTheDocument()
  expect(screen.getByText(texts.profile.listsLabel)).toBeInTheDocument()
})

test('renders the number of lists', () => {
  render(<ProfileStats gamesRated={0} listsCount={3} />)

  // o card de listas exibe a contagem real, sem selo "Em breve"
  const listsValue = screen.getByText(texts.profile.listsLabel).previousElementSibling
  expect(listsValue).toHaveTextContent('3')
})

test('marks only reviews as coming soon', () => {
  render(<ProfileStats gamesRated={0} listsCount={0} />)

  // apenas reviews ainda não existe: só ele exibe o selo "Em breve"
  expect(screen.getAllByText(texts.profile.comingSoon)).toHaveLength(1)
})

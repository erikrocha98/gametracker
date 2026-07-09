import { render, screen } from '@testing-library/react'
import { StatusCounters } from './StatusCounters'
import { texts } from '../../../constants/texts'

test('renders each status label with its count', () => {
  render(<StatusCounters statusCounts={{ wantToPlay: 3, playing: 1, finished: 5 }} />)

  expect(screen.getByText(texts.profile.statusWantToPlayLabel)).toBeInTheDocument()
  expect(screen.getByText('3')).toBeInTheDocument()
  expect(screen.getByText(texts.profile.statusPlayingLabel)).toBeInTheDocument()
  expect(screen.getByText('1')).toBeInTheDocument()
  expect(screen.getByText(texts.profile.statusFinishedLabel)).toBeInTheDocument()
  expect(screen.getByText('5')).toBeInTheDocument()
})

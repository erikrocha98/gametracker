import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { texts } from '../../../constants/texts'
import { ProfileCard } from './ProfileCard'

vi.mock('../../../services/auth', () => ({
  updateBio: vi.fn(() => Promise.resolve()),
}))

import { updateBio } from '../../../services/auth'

beforeEach(() => {
  vi.clearAllMocks()
})

function renderCard(props: Partial<Parameters<typeof ProfileCard>[0]> = {}) {
  render(
    <MuiThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <ProfileCard username="erik" bio={null} gamesCount={0} averageRating={null} {...props} />
      </StyledThemeProvider>
    </MuiThemeProvider>,
  )
}

test('prefills the field with the existing bio', () => {
  renderCard({ bio: 'jogo desde os 8 anos' })
  expect(screen.getByRole('textbox')).toHaveValue('jogo desde os 8 anos')
})

test('reflects what the user types in the bio field', async () => {
  const user = userEvent.setup()
  renderCard()
  const field = screen.getByRole('textbox')
  await user.type(field, 'nova bio')
  expect(field).toHaveValue('nova bio')
})

test('saving calls updateBio with the typed value', async () => {
  const user = userEvent.setup()
  renderCard()
  await user.type(screen.getByRole('textbox'), 'minha bio')
  await user.click(screen.getByRole('button', { name: texts.profile.bioSaveButton }))
  expect(updateBio).toHaveBeenCalledWith('minha bio')
})

test('shows a success message after saving', async () => {
  const user = userEvent.setup()
  renderCard()
  await user.type(screen.getByRole('textbox'), 'minha bio')
  await user.click(screen.getByRole('button', { name: texts.profile.bioSaveButton }))
  // findBy: o FeedbackModal abre após a promise de updateBio resolver
  expect(await screen.findByText(texts.profile.bioSaveSuccess)).toBeInTheDocument()
})

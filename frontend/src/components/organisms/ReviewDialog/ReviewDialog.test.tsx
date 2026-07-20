import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../../theme/theme'
import { ReviewDialog } from './ReviewDialog'
import { texts } from '../../../constants/texts'
import { getGameDetails, writeReview, removeReview } from '../../../services/games'
import type { GameDetailResponse, UserReview } from '../../../types/game'

vi.mock('../../../services/games')

function detail(overrides: Partial<GameDetailResponse> = {}): GameDetailResponse {
  return {
    id: 'rawg-1',
    name: 'The Witcher 3',
    description: null,
    releaseDate: null,
    coverUrl: null,
    genres: [],
    platforms: [],
    developers: [],
    platformAverageRating: null,
    rawgRating: null,
    screenshots: [],
    userRating: null,
    userReview: null,
    userReviewCreatedAt: null,
    ...overrides,
  }
}

function savedReview(overrides: Partial<UserReview> = {}): UserReview {
  return {
    gameId: 'rawg-1',
    name: 'The Witcher 3',
    coverUrl: null,
    platforms: [],
    releaseYear: null,
    rating: null,
    review: 'Muito bom',
    reviewCreatedAt: '2026-07-20T00:00:00Z',
    ...overrides,
  }
}

function renderDialog() {
  const onClose = vi.fn()
  render(
    <ThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <ReviewDialog open gameId="rawg-1" gameName="The Witcher 3" onClose={onClose} />
      </StyledThemeProvider>
    </ThemeProvider>,
  )
  return { onClose }
}

beforeEach(() => {
  vi.mocked(getGameDetails).mockReset()
  vi.mocked(writeReview).mockReset()
  vi.mocked(removeReview).mockReset()
})

test('loads and shows an existing review when the dialog opens', async () => {
  vi.mocked(getGameDetails).mockResolvedValue(
    detail({ userReview: 'Já escrito', userReviewCreatedAt: '2026-07-13T00:00:00Z' }),
  )
  renderDialog()

  expect(await screen.findByText('Já escrito')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: texts.gameDetails.reviewEditButton })).toBeInTheDocument()
})

test('writing a review persists it through the service and confirms with a success message', async () => {
  const user = userEvent.setup()
  vi.mocked(getGameDetails).mockResolvedValue(detail({ userReview: null }))
  vi.mocked(writeReview).mockResolvedValue(savedReview({ review: 'Muito bom' }))
  renderDialog()

  await user.type(await screen.findByRole('textbox'), 'Muito bom')
  await user.click(screen.getByRole('button', { name: texts.gameDetails.reviewSaveButton }))

  expect(writeReview).toHaveBeenCalledWith('rawg-1', 'Muito bom')
  expect(await screen.findByText(texts.gameDetails.reviewSaveSuccess)).toBeInTheDocument()
})

test('deleting a review asks for confirmation and then calls the service', async () => {
  const user = userEvent.setup()
  vi.mocked(getGameDetails).mockResolvedValue(
    detail({ userReview: 'Apagar isso', userReviewCreatedAt: '2026-07-13T00:00:00Z' }),
  )
  vi.mocked(removeReview).mockResolvedValue(undefined)
  renderDialog()

  await user.click(await screen.findByRole('button', { name: texts.gameDetails.reviewDeleteButton }))
  // ainda não removeu: só abriu a confirmação
  expect(removeReview).not.toHaveBeenCalled()

  // dois dialogs coexistem (o modal da review e o de confirmação); desambiguamos pelo título
  const confirmDialog = await screen.findByRole('dialog', { name: texts.gameDetails.reviewDeleteConfirmTitle })
  await user.click(
    within(confirmDialog).getByRole('button', { name: texts.gameDetails.reviewDeleteConfirmButton }),
  )

  expect(removeReview).toHaveBeenCalledWith('rawg-1')
  expect(await screen.findByText(texts.gameDetails.reviewDeleteSuccess)).toBeInTheDocument()
})

test('shows an error message when the current review cannot be loaded', async () => {
  vi.mocked(getGameDetails).mockRejectedValue(new Error('boom'))
  renderDialog()

  expect(await screen.findByText(texts.myGames.reviewDialogLoadError)).toBeInTheDocument()
})

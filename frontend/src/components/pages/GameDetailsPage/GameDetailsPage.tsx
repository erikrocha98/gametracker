import SearchOffIcon from '@mui/icons-material/SearchOff'
import { Button, CircularProgress, Typography } from '@mui/material'
import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { useGameDetails } from '../../../hooks/useGameDetails'
import { addToWantToPlay, rateGame, removeRating } from '../../../services/games'
import { EmptyState } from '../../molecules/EmptyState'
import { FeedbackModal } from '../../molecules/FeedbackModal'
import { GameDetailsHeader } from '../../organisms/GameDetailsHeader'
import { GameDescription } from '../../organisms/GameDescription'
import { GameScreenshots } from '../../organisms/GameScreenshots'

const PageWrapper = styled.div`
  padding: 32px 0;
  display: flex;
  flex-direction: column;
  gap: 0;
`

const Divider = styled.hr`
  border: none;
  border-bottom: 1px solid ${colors.headerBorder};
  margin: 32px 0;
`

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 80px 0;
`

const ErrorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 0;
  text-align: center;
`

export function GameDetailsPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const { status, data, refetch } = useGameDetails(gameId)
  const [addLoading, setAddLoading] = useState(false)
  const [added, setAdded] = useState(false)
  // undefined = not yet overridden by the user; null/number = user-set value
  const [userRatingOverride, setUserRatingOverride] = useState<number | null | undefined>(undefined)
  const userRating = userRatingOverride !== undefined ? userRatingOverride : (data?.userRating ?? null)
  const [ratingLoading, setRatingLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; open: boolean }>({
    type: 'success',
    message: '',
    open: false,
  })

  // Reset per-game local state when navigating to another game (same route, new param).
  // Adjusting state during render on a changed value is React's recommended pattern and
  // avoids the cascading renders of calling setState inside an effect.
  const [trackedGameId, setTrackedGameId] = useState(gameId)
  if (gameId !== trackedGameId) {
    setTrackedGameId(gameId)
    setAdded(false)
    setUserRatingOverride(undefined)
  }

  const handleAddToWantToPlay = useCallback(async () => {
    if (!gameId) return
    setAddLoading(true)
    try {
      await addToWantToPlay(gameId)
      setAdded(true)
      setFeedback({ type: 'success', message: texts.gameDetails.addToWantToPlaySuccess, open: true })
    } catch {
      setFeedback({ type: 'error', message: texts.gameDetails.addToWantToPlayError, open: true })
    } finally {
      setAddLoading(false)
    }
  }, [gameId])

  const handleRate = useCallback(async (value: number | null) => {
    if (!gameId) return
    setRatingLoading(true)
    try {
      if (value === null) {
        await removeRating(gameId)
        setUserRatingOverride(null)
        setFeedback({ type: 'success', message: texts.gameDetails.ratingRemovedSuccess, open: true })
      } else {
        await rateGame(gameId, value)
        setUserRatingOverride(value)
        setAdded(true)
        setFeedback({ type: 'success', message: texts.gameDetails.rateSuccess, open: true })
      }
    } catch {
      const message = value === null ? texts.gameDetails.removeRatingError : texts.gameDetails.rateError
      setFeedback({ type: 'error', message, open: true })
    } finally {
      setRatingLoading(false)
    }
  }, [gameId])

  if (status === 'loading' || status === 'idle') {
    return (
      <LoadingWrapper>
        <CircularProgress size={40} sx={{ color: colors.primary }} />
      </LoadingWrapper>
    )
  }

  if (status === 'not-found') {
    return (
      <PageWrapper>
        <EmptyState
          icon={<SearchOffIcon sx={{ fontSize: 48, color: colors.textSecondary }} />}
          title={texts.gameDetails.notFoundTitle}
          description={texts.gameDetails.notFoundDescription}
        />
      </PageWrapper>
    )
  }

  if (status === 'error') {
    return (
      <ErrorWrapper>
        <Typography variant="body1" sx={{ color: colors.error }}>
          {texts.gameDetails.loadError}
        </Typography>
        <Button variant="outlined" onClick={refetch} sx={{ color: colors.primary, borderColor: colors.primary }}>
          {texts.gameDetails.retry}
        </Button>
      </ErrorWrapper>
    )
  }

  if (!data) return null

  return (
    <>
      <PageWrapper>
        <GameDetailsHeader
          game={data}
          onAddToWantToPlay={handleAddToWantToPlay}
          addLoading={addLoading}
          added={added}
          userRating={userRating}
          onRate={handleRate}
          ratingLoading={ratingLoading}
        />
        <Divider />
        <GameDescription description={data.description} />
        <Divider />
        <GameScreenshots screenshots={data.screenshots} />
      </PageWrapper>

      <FeedbackModal
        type={feedback.type}
        message={feedback.message}
        open={feedback.open}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      />
    </>
  )
}

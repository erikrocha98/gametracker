import { useCallback, useEffect, useState } from 'react'
import { CircularProgress, Dialog, DialogContent, DialogTitle, Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { getGameDetails, removeReview, writeReview } from '../../../services/games'
import { FeedbackModal } from '../../molecules/FeedbackModal'
import { ReviewSection } from '../ReviewSection'

export interface ReviewDialogProps {
  open: boolean
  gameId: string | null
  gameName?: string
  onClose: () => void
  onSaved?: () => void
}

type Status = 'loading' | 'error' | 'ready'

const StatusWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 24px 0;
`

const StatusText = styled(Typography)`
  padding: 16px;
  text-align: center;
`

export function ReviewDialog({ open, gameId, gameName, onClose, onSaved }: ReviewDialogProps) {
  const [status, setStatus] = useState<Status>('loading')
  const [review, setReview] = useState<string | null>(null)
  const [reviewCreatedAt, setReviewCreatedAt] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; open: boolean }>({
    type: 'success',
    message: '',
    open: false,
  })

  const stopEvent = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  useEffect(() => {
    if (!open || !gameId) return
    let active = true
    setStatus('loading')
    getGameDetails(gameId)
      .then((data) => {
        if (!active) return
        setReview(data.userReview)
        setReviewCreatedAt(data.userReviewCreatedAt)
        setStatus('ready')
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [open, gameId])

  const handleSave = useCallback(
    async (text: string) => {
      if (!gameId) return
      setSaving(true)
      try {
        const result = await writeReview(gameId, text)
        setReview(result.review)
        setReviewCreatedAt(result.reviewCreatedAt)
        onSaved?.()
        setFeedback({ type: 'success', message: texts.gameDetails.reviewSaveSuccess, open: true })
      } catch {
        setFeedback({ type: 'error', message: texts.gameDetails.reviewSaveError, open: true })
      } finally {
        setSaving(false)
      }
    },
    [gameId, onSaved],
  )

  const handleDelete = useCallback(async () => {
    if (!gameId) return
    setSaving(true)
    try {
      await removeReview(gameId)
      setReview(null)
      setReviewCreatedAt(null)
      onSaved?.()
      setFeedback({ type: 'success', message: texts.gameDetails.reviewDeleteSuccess, open: true })
    } catch {
      setFeedback({ type: 'error', message: texts.gameDetails.reviewDeleteError, open: true })
    } finally {
      setSaving(false)
    }
  }, [gameId, onSaved])

  return (
    <>
      <Dialog open={open} onClose={onClose} onClick={stopEvent} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: colors.textPrimary }}>
          {gameName ?? texts.myGames.reviewDialogTitle}
        </DialogTitle>
        <DialogContent>
          {status === 'loading' && (
            <StatusWrapper>
              <CircularProgress size={24} sx={{ color: colors.primary }} />
            </StatusWrapper>
          )}
          {status === 'error' && (
            <StatusText variant="body2" sx={{ color: colors.error }}>
              {texts.myGames.reviewDialogLoadError}
            </StatusText>
          )}
          {status === 'ready' && (
            <ReviewSection
              review={review}
              reviewCreatedAt={reviewCreatedAt}
              onSave={handleSave}
              onDelete={handleDelete}
              loading={saving}
              showTitle={false}
            />
          )}
        </DialogContent>
      </Dialog>

      <FeedbackModal
        type={feedback.type}
        message={feedback.message}
        open={feedback.open}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      />
    </>
  )
}

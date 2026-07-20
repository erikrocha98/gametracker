import { useCallback, useState } from 'react'
import { Button, TextField, Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { formatReleaseDate } from '../../../utils/game'
import { ConfirmDialog } from '../../molecules/ConfirmDialog'

const MAX_REVIEW_LENGTH = 5000

interface ReviewSectionProps {
  review: string | null
  reviewCreatedAt: string | null
  onSave: (text: string) => void
  onDelete: () => void
  loading?: boolean
  showTitle?: boolean
}

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Editor = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const CounterRow = styled.div`
  display: flex;
  justify-content: flex-end;
`

const Actions = styled.div`
  display: flex;
  gap: 8px;
`

const ReviewText = styled(Typography)`
  white-space: pre-wrap;
`

export function ReviewSection({ review, reviewCreatedAt, onSave, onDelete, loading = false, showTitle = true }: ReviewSectionProps) {
  const [draft, setDraft] = useState(review ?? '')
  const [isEditing, setIsEditing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Sync local draft and exit edit mode whenever the persisted review changes
  // (after a successful save or delete), following React's render-time reset pattern.
  const [trackedReview, setTrackedReview] = useState(review)
  if (review !== trackedReview) {
    setTrackedReview(review)
    setDraft(review ?? '')
    setIsEditing(false)
  }

  const trimmed = draft.trim()
  const isInvalid = trimmed.length === 0 || draft.length > MAX_REVIEW_LENGTH

  const handleSave = useCallback(() => {
    if (isInvalid || loading) return
    onSave(trimmed)
  }, [isInvalid, loading, onSave, trimmed])

  const handleStartEdit = useCallback(() => setIsEditing(true), [])

  const handleCancelEdit = useCallback(() => {
    setDraft(review ?? '')
    setIsEditing(false)
  }, [review])

  const handleOpenConfirm = useCallback(() => setConfirmOpen(true), [])
  const handleCloseConfirm = useCallback(() => setConfirmOpen(false), [])

  const handleConfirmDelete = useCallback(() => {
    setConfirmOpen(false)
    onDelete()
  }, [onDelete])

  const showEditor = review === null || isEditing
  const createdAtLabel = formatReleaseDate(reviewCreatedAt)

  return (
    <Section>
      {showTitle && (
        <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
          {texts.gameDetails.reviewSectionTitle}
        </Typography>
      )}

      {showEditor ? (
        <Editor>
          <TextField
            multiline
            minRows={4}
            fullWidth
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={texts.gameDetails.reviewPlaceholder}
            slotProps={{ htmlInput: { maxLength: MAX_REVIEW_LENGTH } }}
          />
          <CounterRow>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              {texts.gameDetails.reviewCharCounter(draft.length)}
            </Typography>
          </CounterRow>
          <Actions>
            <Button variant="contained" onClick={handleSave} disabled={isInvalid || loading}>
              {texts.gameDetails.reviewSaveButton}
            </Button>
            {isEditing && (
              <Button onClick={handleCancelEdit} disabled={loading} sx={{ color: colors.textSecondary }}>
                {texts.gameDetails.reviewDeleteCancelButton}
              </Button>
            )}
          </Actions>
        </Editor>
      ) : (
        <>
          <ReviewText variant="body2" sx={{ color: colors.textSecondary, lineHeight: 1.7 }}>
            {review}
          </ReviewText>
          {createdAtLabel && (
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              {texts.gameDetails.reviewCreatedAtLabel(createdAtLabel)}
            </Typography>
          )}
          <Actions>
            <Button variant="outlined" onClick={handleStartEdit} disabled={loading}>
              {texts.gameDetails.reviewEditButton}
            </Button>
            <Button
              onClick={handleOpenConfirm}
              disabled={loading}
              sx={{ color: colors.error }}
            >
              {texts.gameDetails.reviewDeleteButton}
            </Button>
          </Actions>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={texts.gameDetails.reviewDeleteConfirmTitle}
        description={texts.gameDetails.reviewDeleteConfirmDescription}
        confirmLabel={texts.gameDetails.reviewDeleteConfirmButton}
        cancelLabel={texts.gameDetails.reviewDeleteCancelButton}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseConfirm}
        loading={loading}
        destructive
      />
    </Section>
  )
}

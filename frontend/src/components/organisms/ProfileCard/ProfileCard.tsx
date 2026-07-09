import { useCallback, useState } from 'react'
import { Button, TextField, Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { updateBio } from '../../../services/auth'
import { formatRating } from '../../../utils/game'
import { Avatar } from '../../atoms/Avatar'
import { FeedbackModal } from '../../molecules/FeedbackModal'

interface ProfileCardProps {
  username: string
  bio: string | null
  gamesCount: number
  averageRating: number | null
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 24px;
  border-radius: 12px;
  background-color: ${colors.backgroundPaper};
  border: 1px solid ${colors.inputBorder};
`

const Identity = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`

const BioForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`

const SummaryRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 32px;
  width: 100%;
  padding-top: 8px;
  border-top: 1px solid ${colors.inputBorder};
`

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

export function ProfileCard({ username, bio, gamesCount, averageRating }: ProfileCardProps) {
  const [bioValue, setBioValue] = useState(bio ?? '')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; open: boolean }>({
    type: 'success',
    message: '',
    open: false,
  })

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      setSaving(true)
      try {
        const trimmed = bioValue.trim()
        await updateBio(trimmed || null)
        setFeedback({ type: 'success', message: texts.profile.bioSaveSuccess, open: true })
      } catch {
        setFeedback({ type: 'error', message: texts.profile.bioSaveError, open: true })
      } finally {
        setSaving(false)
      }
    },
    [bioValue],
  )

  const closeFeedback = useCallback(() => setFeedback((prev) => ({ ...prev, open: false })), [])

  return (
    <>
      <Card>
        <Avatar username={username} size={96} />

        <Identity>
          <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 700 }}>
            {username}
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            {texts.profile.usernamePrefix}
            {username}
          </Typography>
        </Identity>

        <BioForm onSubmit={handleSubmit}>
          <TextField
            multiline
            minRows={3}
            fullWidth
            value={bioValue}
            onChange={(event) => setBioValue(event.target.value)}
            placeholder={texts.profile.bioPlaceholder}
          />
          <Button type="submit" variant="contained" disabled={saving}>
            {texts.profile.bioSaveButton}
          </Button>
        </BioForm>

        <SummaryRow>
          <SummaryItem>
            <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 700 }}>
              {gamesCount}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              {texts.profile.summaryGamesLabel}
            </Typography>
          </SummaryItem>
          <SummaryItem>
            <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 700 }}>
              {formatRating(averageRating)}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              {texts.profile.summaryAverageLabel}
            </Typography>
          </SummaryItem>
        </SummaryRow>
      </Card>

      <FeedbackModal
        type={feedback.type}
        message={feedback.message}
        open={feedback.open}
        onClose={closeFeedback}
      />
    </>
  )
}

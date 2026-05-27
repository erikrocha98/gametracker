import { Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { formatRating } from '../../../utils/game'
import { texts } from '../../../constants/texts'

interface RatingBadgeProps {
  label: string
  value: number | null
  comingSoon?: boolean
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 20px;
  border-radius: 8px;
  background-color: ${colors.backgroundPaper};
  border: 1px solid ${colors.inputBorder};
  min-width: 96px;
`

export function RatingBadge({ label, value, comingSoon = false }: RatingBadgeProps) {
  return (
    <Card>
      <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{ color: comingSoon ? colors.textSecondary : colors.textPrimary, fontWeight: 700 }}
      >
        {comingSoon ? texts.gameDetails.ratingPlatformComingSoon : formatRating(value)}
      </Typography>
    </Card>
  )
}

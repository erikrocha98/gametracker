import { Button, Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  border-radius: 12px;
  background-color: ${colors.backgroundPaper};
  text-align: center;
`

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card>
      <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: colors.textSecondary }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button
          variant="contained"
          size="small"
          onClick={onAction}
          sx={{ mt: 1 }}
        >
          {actionLabel}
        </Button>
      )}
    </Card>
  )
}

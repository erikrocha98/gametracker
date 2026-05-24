import { Button, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'

interface EmptyStateProps {
  title: string
  description: string
  icon?: ReactNode
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
  border: 1px solid ${colors.inputBorder};
  text-align: center;
`

export function EmptyState({ title, description, icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card>
      {icon}
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

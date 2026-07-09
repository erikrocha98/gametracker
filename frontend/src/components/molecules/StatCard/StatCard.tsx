import { Typography } from '@mui/material'
import type { ReactNode } from 'react'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'

interface StatCardProps {
  value: string | number
  label: string
  icon: ReactNode
  caption?: string
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border-radius: 8px;
  background-color: ${colors.backgroundPaper};
  border: 1px solid ${colors.inputBorder};
`

const IconRow = styled.div`
  display: flex;
  color: ${colors.primary};
`

export function StatCard({ value, label, icon, caption }: StatCardProps) {
  return (
    <Card>
      <IconRow aria-hidden>{icon}</IconRow>
      <Typography variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: colors.textSecondary }}>
        {label}
      </Typography>
      {caption && (
        <Typography variant="caption" sx={{ color: colors.textSecondary, fontStyle: 'italic' }}>
          {caption}
        </Typography>
      )}
    </Card>
  )
}

import { Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'

interface GameDescriptionProps {
  description: string | null
}

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

export function GameDescription({ description }: GameDescriptionProps) {
  return (
    <Section>
      <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
        {texts.gameDetails.aboutTitle}
      </Typography>
      <Typography variant="body2" sx={{ color: colors.textSecondary, lineHeight: 1.7 }}>
        {description ?? texts.gameDetails.noDescription}
      </Typography>
    </Section>
  )
}

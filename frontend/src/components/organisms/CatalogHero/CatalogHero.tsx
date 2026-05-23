import { Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'

const Section = styled.section`
  padding: 64px 0 48px;
`

export function CatalogHero() {
  return (
    <Section>
      <Typography
        variant="h3"
        sx={{ color: colors.textPrimary, fontWeight: 700, lineHeight: 1.2 }}
      >
        {texts.catalog.heroTitle}
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: colors.textSecondary, mt: 2 }}
      >
        {texts.catalog.heroSubtitle}
      </Typography>
    </Section>
  )
}

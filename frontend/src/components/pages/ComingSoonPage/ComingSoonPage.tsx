import { Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  gap: 12px;
  text-align: center;
`

export function ComingSoonPage() {
  return (
    <Wrapper>
      <Typography variant="h5" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
        {texts.comingSoon.title}
      </Typography>
      <Typography variant="body2" sx={{ color: colors.textSecondary }}>
        {texts.comingSoon.description}
      </Typography>
    </Wrapper>
  )
}

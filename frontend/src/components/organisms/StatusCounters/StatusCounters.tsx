import { Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import type { StatusCounts } from '../../../types/game'

interface StatusCountersProps {
  statusCounts: StatusCounts
}

const Wrapper = styled.div`
  display: flex;
  gap: 16px;
`

const Counter = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border-radius: 8px;
  background-color: ${colors.backgroundPaper};
  border: 1px solid ${colors.inputBorder};
`

export function StatusCounters({ statusCounts }: StatusCountersProps) {
  const items = [
    { key: 'want_to_play', label: texts.profile.statusWantToPlayLabel, value: statusCounts.wantToPlay },
    { key: 'playing', label: texts.profile.statusPlayingLabel, value: statusCounts.playing },
    { key: 'finished', label: texts.profile.statusFinishedLabel, value: statusCounts.finished },
  ]

  return (
    <Wrapper>
      {items.map((item) => (
        <Counter key={item.key}>
          <Typography variant="h5" sx={{ color: colors.textPrimary, fontWeight: 700 }}>
            {item.value}
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            {item.label}
          </Typography>
        </Counter>
      ))}
    </Wrapper>
  )
}

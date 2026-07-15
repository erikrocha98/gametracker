import StarBorderIcon from '@mui/icons-material/StarBorder'
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import styled from 'styled-components'
import { texts } from '../../../constants/texts'
import { StatCard } from '../../molecules/StatCard'

interface ProfileStatsProps {
  gamesRated: number
  listsCount: number
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
`

export function ProfileStats({ gamesRated, listsCount }: ProfileStatsProps) {
  return (
    <Grid>
      <StatCard value={gamesRated} label={texts.profile.gamesRatedLabel} icon={<StarBorderIcon />} />
      <StatCard
        value={0}
        label={texts.profile.reviewsLabel}
        icon={<RateReviewOutlinedIcon />}
        caption={texts.profile.comingSoon}
      />
      <StatCard
        value={listsCount}
        label={texts.profile.listsLabel}
        icon={<FormatListBulletedIcon />}
      />
    </Grid>
  )
}

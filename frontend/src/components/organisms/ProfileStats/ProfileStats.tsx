import StarBorderIcon from '@mui/icons-material/StarBorder'
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import styled from 'styled-components'
import { texts } from '../../../constants/texts'
import { StatCard } from '../../molecules/StatCard'

interface ProfileStatsProps {
  gamesRated: number
  reviewsCount: number
  listsCount: number
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
`

export function ProfileStats({ gamesRated, reviewsCount, listsCount }: ProfileStatsProps) {
  return (
    <Grid>
      <StatCard value={gamesRated} label={texts.profile.gamesRatedLabel} icon={<StarBorderIcon />} />
      <StatCard
        value={reviewsCount}
        label={texts.profile.reviewsLabel}
        icon={<RateReviewOutlinedIcon />}
      />
      <StatCard
        value={listsCount}
        label={texts.profile.listsLabel}
        icon={<FormatListBulletedIcon />}
      />
    </Grid>
  )
}

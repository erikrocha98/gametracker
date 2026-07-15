import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { EmptyState } from '../../molecules/EmptyState'
import { ListGameCard } from '../../molecules/ListGameCard'
import type { ListGame } from '../../../types/list'

interface ListGamesGridProps {
  items: ListGame[]
  onRemove: (gameId: string) => void
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
`

export function ListGamesGrid({ items, onRemove }: ListGamesGridProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<SportsEsportsIcon sx={{ fontSize: 48, color: colors.textSecondary }} />}
        title={texts.myLists.detailGamesEmptyTitle}
        description={texts.myLists.detailGamesEmptyDescription}
      />
    )
  }

  return (
    <Grid>
      {items.map((game) => (
        <ListGameCard
          key={game.gameId}
          game={game}
          onRemove={() => onRemove(game.gameId)}
        />
      ))}
    </Grid>
  )
}

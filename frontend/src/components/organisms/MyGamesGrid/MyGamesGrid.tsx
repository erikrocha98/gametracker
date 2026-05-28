import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import { CircularProgress, Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { EmptyState } from '../../molecules/EmptyState'
import { GameCard } from '../../molecules/GameCard'
import type { CollectionGame } from '../../../types/game'

interface MyGamesGridProps {
  items: CollectionGame[]
  loading: boolean
  error: boolean
  onRemove: (gameId: string) => void
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
`

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 48px 0;
`

export function MyGamesGrid({ items, loading, error, onRemove }: MyGamesGridProps) {
  if (loading) {
    return (
      <LoadingWrapper>
        <CircularProgress size={32} sx={{ color: colors.primary }} />
      </LoadingWrapper>
    )
  }

  if (error) {
    return (
      <Typography variant="body2" sx={{ color: colors.error }}>
        {texts.myGames.loadError}
      </Typography>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<SportsEsportsIcon sx={{ fontSize: 48, color: colors.textSecondary }} />}
        title={texts.myGames.emptyTitle}
        description={texts.myGames.emptyDescription}
      />
    )
  }

  return (
    <Grid>
      {items.map((game) => (
        <GameCard key={game.id} game={game} onRemove={() => onRemove(game.gameId)} />
      ))}
    </Grid>
  )
}

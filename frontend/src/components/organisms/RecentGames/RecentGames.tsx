import { useCallback } from 'react'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import type { CollectionGame } from '../../../types/game'
import { EmptyState } from '../../molecules/EmptyState'
import { GameCard } from '../../molecules/GameCard'

interface RecentGamesProps {
  games: CollectionGame[]
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
`

export function RecentGames({ games }: RecentGamesProps) {
  const navigate = useNavigate()
  const handleAddGame = useCallback(() => navigate('/'), [navigate])

  if (games.length === 0) {
    return (
      <EmptyState
        icon={<SportsEsportsIcon sx={{ fontSize: 48, color: colors.textSecondary }} />}
        title={texts.profile.emptyTitle}
        description={texts.profile.emptyDescription}
        actionLabel={texts.profile.emptyAction}
        onAction={handleAddGame}
      />
    )
  }

  return (
    <Grid>
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </Grid>
  )
}

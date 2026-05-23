import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { formatYear } from '../../../utils/game'
import type { CollectionGame } from '../../../types/game'

interface GameCardProps {
  game: CollectionGame
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  background-color: ${colors.backgroundPaper};
  transition: background-color 0.15s;
  cursor: pointer;

  &:hover {
    background-color: ${colors.cardHover};
  }
`

const CoverWrapper = styled.div`
  width: 100%;
  aspect-ratio: 3/4;
  border-radius: 4px;
  overflow: hidden;
  background-color: ${colors.placeholderBackground};
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`

const Name = styled.p`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Meta = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export function GameCard({ game }: GameCardProps) {
  return (
    <Card>
      <CoverWrapper>
        {game.coverUrl ? (
          <img src={game.coverUrl} alt={game.name} />
        ) : (
          <SportsEsportsIcon sx={{ color: colors.textSecondary, fontSize: 36 }} aria-hidden />
        )}
      </CoverWrapper>
      <div>
        <Name>{game.name}</Name>
        <Meta>
          {[game.platforms.slice(0, 2).join(', '), formatYear(game.releaseYear)]
            .filter(Boolean)
            .join(' · ')}
        </Meta>
      </div>
    </Card>
  )
}

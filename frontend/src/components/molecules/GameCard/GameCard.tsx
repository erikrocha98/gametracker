import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { formatYear } from '../../../utils/game'
import type { CollectionGame, GameStatus } from '../../../types/game'
import { GamepadRating } from '../GamepadRating'
import { GameCardMenu } from '../GameCardMenu'

interface GameCardProps {
  game: CollectionGame
  onRemove?: () => void
  onRate?: (value: number | null) => void
  onStatusChange?: (status: GameStatus) => void
  onAddToList?: () => void
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const CardLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;
`

const RatingRow = styled.div`
  padding: 0 4px;
`

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

  &:hover .game-card-footer,
  &:focus-within .game-card-footer {
    opacity: 1;
    pointer-events: auto;
  }
`

const CoverWrapper = styled.div`
  position: relative;
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

export function GameCard({ game, onRemove, onRate, onStatusChange, onAddToList }: GameCardProps) {
  return (
    <Wrapper>
      <CardLink to={`/games/${game.gameId}`}>
        <Card>
          <CoverWrapper>
            {game.coverUrl ? (
              <img src={game.coverUrl} alt={game.name} />
            ) : (
              <SportsEsportsIcon sx={{ color: colors.textSecondary, fontSize: 36 }} aria-hidden />
            )}
            {onRemove && onRate && onStatusChange && (
              <GameCardMenu
                status={game.status}
                rating={game.rating}
                onStatusChange={onStatusChange}
                onRate={onRate}
                onDelete={onRemove}
                onAddToList={onAddToList}
              />
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
      </CardLink>
      {game.rating != null && (
        <RatingRow>
          <GamepadRating value={game.rating} readOnly size="small" />
        </RatingRow>
      )}
    </Wrapper>
  )
}

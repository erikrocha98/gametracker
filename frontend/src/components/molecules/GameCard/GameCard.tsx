import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import { IconButton } from '@mui/material'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { formatYear } from '../../../utils/game'
import type { CollectionGame } from '../../../types/game'
import { GamepadRating } from '../GamepadRating'

interface GameCardProps {
  game: CollectionGame
  onRemove?: () => void
}

const CardLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;
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

const RemoveButton = styled(IconButton)`
  position: absolute !important;
  top: 8px !important;
  right: 8px !important;
  background-color: ${colors.overlayCardAction} !important;
  color: ${colors.textPrimary} !important;
  padding: 4px !important;

  &:hover {
    color: ${colors.error} !important;
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

export function GameCard({ game, onRemove }: GameCardProps) {
  return (
    <CardLink to={`/games/${game.gameId}`}>
      <Card>
        <CoverWrapper>
          {game.coverUrl ? (
            <img src={game.coverUrl} alt={game.name} />
          ) : (
            <SportsEsportsIcon sx={{ color: colors.textSecondary, fontSize: 36 }} aria-hidden />
          )}
          {onRemove && (
            <RemoveButton
              size="small"
              aria-label={texts.myGames.removeAriaLabel}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onRemove()
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </RemoveButton>
          )}
        </CoverWrapper>
        <div>
          <Name>{game.name}</Name>
          <Meta>
            {[game.platforms.slice(0, 2).join(', '), formatYear(game.releaseYear)]
              .filter(Boolean)
              .join(' · ')}
          </Meta>
          {game.rating != null && (
            <GamepadRating value={game.rating} readOnly size="small" />
          )}
        </div>
      </Card>
    </CardLink>
  )
}

import type { MouseEvent } from 'react'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { IconButton } from '@mui/material'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { formatYear } from '../../../utils/game'
import type { ListGame } from '../../../types/list'

interface ListGameCardProps {
  game: ListGame
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

  &:hover .list-game-footer,
  &:focus-within .list-game-footer {
    transform: translateY(0);
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

const Footer = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  padding: 6px 8px;
  background-color: ${colors.overlayCardAction};
  /* escondida deslizando para fora da capa (o CoverWrapper tem overflow: hidden) */
  transform: translateY(100%);
  transition: transform 0.15s;
`

const RemoveButton = styled(IconButton)`
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

export function ListGameCard({ game, onRemove }: ListGameCardProps) {
  const handleRemove = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onRemove?.()
  }

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
            <Footer className="list-game-footer">
              <RemoveButton
                size="small"
                aria-label={texts.myLists.removeGameAriaLabel}
                onClick={handleRemove}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </RemoveButton>
            </Footer>
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
  )
}

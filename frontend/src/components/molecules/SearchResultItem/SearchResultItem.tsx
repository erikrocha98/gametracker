import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { GameCover } from '../../atoms/GameCover'
import { formatYear } from '../../../utils/game'
import type { GameSearchResult } from '../../../types/game'

interface SearchResultItemProps {
  result: GameSearchResult
  onClick: () => void
}

const Item = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.15s;

  &:hover {
    background-color: ${colors.cardHover};
  }
`

const Info = styled.div`
  flex: 1;
  min-width: 0;
`

const Name = styled.p`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Meta = styled.p`
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: ${colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export function SearchResultItem({ result, onClick }: SearchResultItemProps) {
  const meta = [result.platforms.slice(0, 2).join(', '), formatYear(result.releaseYear)]
    .filter(Boolean)
    .join(' · ')

  return (
    <Item to={`/games/${result.id}`} onClick={onClick}>
      <GameCover coverUrl={result.coverUrl} name={result.name} size="sm" />
      <Info>
        <Name>{result.name}</Name>
        <Meta>{meta}</Meta>
      </Info>
    </Item>
  )
}

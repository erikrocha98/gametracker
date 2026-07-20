import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { formatReleaseDate } from '../../../utils/game'
import type { UserReview } from '../../../types/game'
import { GameCover } from '../../atoms/GameCover'
import { GamepadRating } from '../GamepadRating'

interface ReviewCardProps {
  review: UserReview
}

const CardLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;
`

const Card = styled.div`
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  background-color: ${colors.backgroundPaper};
  border: 1px solid ${colors.inputBorder};
  transition: background-color 0.15s;

  &:hover {
    background-color: ${colors.cardHover};
  }
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  flex: 1;
`

const Name = styled.p`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ReviewText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${colors.textSecondary};
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
`

const CreatedAt = styled.span`
  font-size: 0.75rem;
  color: ${colors.textSecondary};
`

export function ReviewCard({ review }: ReviewCardProps) {
  const createdAt = formatReleaseDate(review.reviewCreatedAt)

  return (
    <CardLink to={`/games/${review.gameId}`}>
      <Card>
        <GameCover coverUrl={review.coverUrl} name={review.name} size="md" />
        <Content>
          <Name>{review.name}</Name>
          <ReviewText>{review.review}</ReviewText>
          <Footer>
            {createdAt && <CreatedAt>{createdAt}</CreatedAt>}
            {review.rating != null && <GamepadRating value={review.rating} readOnly size="small" />}
          </Footer>
        </Content>
      </Card>
    </CardLink>
  )
}

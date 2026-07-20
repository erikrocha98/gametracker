import { useCallback, useEffect, useState } from 'react'
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import { CircularProgress, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { getUserReviews } from '../../../services/games'
import { EmptyState } from '../../molecules/EmptyState'
import { ReviewCard } from '../../molecules/ReviewCard'
import type { UserReview } from '../../../types/game'

const PageWrapper = styled.div`
  padding: 32px 0 64px;
`

const PageTitle = styled(Typography)`
  margin-bottom: 32px !important;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
`

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 48px 0;
`

export function ReviewsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<UserReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getUserReviews()
      .then((data) => setItems(data.items))
      .catch((err) => {
        if (err instanceof Response && err.status === 404) return
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleEmptyAction = useCallback(() => {
    navigate('/my-games')
  }, [navigate])

  return (
    <PageWrapper>
      <PageTitle variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700 }}>
        {texts.reviews.pageTitle}
      </PageTitle>

      {loading ? (
        <LoadingWrapper>
          <CircularProgress size={32} sx={{ color: colors.primary }} />
        </LoadingWrapper>
      ) : error ? (
        <Typography variant="body2" sx={{ color: colors.error }}>
          {texts.reviews.loadError}
        </Typography>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<RateReviewOutlinedIcon sx={{ fontSize: 48, color: colors.textSecondary }} />}
          title={texts.reviews.emptyTitle}
          description={texts.reviews.emptyDescription}
          actionLabel={texts.reviews.emptyAction}
          onAction={handleEmptyAction}
        />
      ) : (
        <Grid>
          {items.map((review) => (
            <ReviewCard key={review.gameId} review={review} />
          ))}
        </Grid>
      )}
    </PageWrapper>
  )
}

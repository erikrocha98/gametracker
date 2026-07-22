import { useEffect, useMemo, useState } from 'react'
import { CircularProgress, Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { useAuth } from '../../../contexts/AuthContext'
import { getCollectionStats } from '../../../services/games'
import { getLists } from '../../../services/lists'
import type { CollectionStats } from '../../../types/game'
import { ProfileCard } from '../../organisms/ProfileCard'
import { ProfileStats } from '../../organisms/ProfileStats'
import { StatusCounters } from '../../organisms/StatusCounters'
import { RecentGames } from '../../organisms/RecentGames'

const PageWrapper = styled.div`
  padding: 32px 0 64px;
`

const PageTitle = styled(Typography)`
  margin-bottom: 32px !important;
`

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(280px, 320px) 1fr;
  gap: 32px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const Activity = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const CenteredState = styled.div`
  display: flex;
  justify-content: center;
  padding: 64px 0;
`

const SectionTitle = styled(Typography)`
  font-weight: 600 !important;
`

export function ProfilePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<CollectionStats | null>(null)
  const [listsCount, setListsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getCollectionStats()
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    getLists()
      .then((data) => setListsCount(data.items.length))
      .catch(() => {})
  }, [])

  const gamesCount = useMemo(() => {
    if (!stats) return 0
    const { wantToPlay, playing, finished } = stats.statusCounts
    return wantToPlay + playing + finished
  }, [stats])

  return (
    <PageWrapper>
      <PageTitle variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700 }}>
        {texts.profile.pageTitle}
      </PageTitle>

      {loading && (
        <CenteredState>
          <CircularProgress size={32} sx={{ color: colors.primary }} />
        </CenteredState>
      )}

      {!loading && (error || !stats || !user) && (
        <Typography variant="body2" sx={{ color: colors.error }}>
          {texts.profile.loadError}
        </Typography>
      )}

      {!loading && !error && stats && user && (
        <Layout>
          <ProfileCard
            username={user.username}
            bio={user.bio}
            gamesCount={gamesCount}
            averageRating={stats.averageRating}
          />

          <Activity>
            <Section>
              <SectionTitle variant="h6" sx={{ color: colors.textPrimary }}>
                {texts.profile.activityTitle}
              </SectionTitle>
              <ProfileStats
                gamesRated={stats.gamesRated}
                reviewsCount={stats.reviewsCount}
                listsCount={listsCount}
              />
            </Section>

            <Section>
              <SectionTitle variant="h6" sx={{ color: colors.textPrimary }}>
                {texts.profile.statusCountersTitle}
              </SectionTitle>
              <StatusCounters statusCounts={stats.statusCounts} />
            </Section>

            <Section>
              <SectionTitle variant="h6" sx={{ color: colors.textPrimary }}>
                {texts.profile.recentGamesTitle}
              </SectionTitle>
              <RecentGames games={stats.recentGames} />
            </Section>
          </Activity>
        </Layout>
      )}
    </PageWrapper>
  )
}

import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import { CircularProgress, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { EmptyState } from '../../molecules/EmptyState'
import { GameCard } from '../../molecules/GameCard'
import type { CollectionGame } from '../../../types/game'

interface CatalogCollectionProps {
  items: CollectionGame[]
  loading: boolean
  error: boolean
}

const Section = styled.section`
  padding-bottom: 64px;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 24px;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
`

const Counter = styled.span`
  font-size: 0.875rem;
  color: ${colors.textSecondary};
`

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 48px 0;
`

export function CatalogCollection({ items, loading, error }: CatalogCollectionProps) {
  const navigate = useNavigate()

  return (
    <Section>
      <SectionHeader>
        <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
          {texts.catalog.sectionTitle}
        </Typography>
        {!loading && !error && (
          <Counter>
            {items.length} {texts.catalog.counterLabel}
          </Counter>
        )}
      </SectionHeader>

      {loading && (
        <LoadingWrapper>
          <CircularProgress size={32} sx={{ color: colors.primary }} />
        </LoadingWrapper>
      )}

      {error && !loading && (
        <Typography variant="body2" sx={{ color: colors.error }}>
          {texts.catalog.loadError}
        </Typography>
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={<SportsEsportsIcon sx={{ fontSize: 48, color: colors.textSecondary }} />}
          title={texts.catalog.emptyTitle}
          description={texts.catalog.emptyDescription}
          actionLabel={texts.catalog.emptyAction}
          onAction={() => navigate('/add-game')}
        />
      )}

      {!loading && !error && items.length > 0 && (
        <Grid>
          {items.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </Grid>
      )}
    </Section>
  )
}

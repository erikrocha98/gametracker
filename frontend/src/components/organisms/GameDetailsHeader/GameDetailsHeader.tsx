import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import { Button, Chip, CircularProgress, Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { GameCover } from '../../atoms/GameCover'
import { RatingBadge } from '../../molecules/RatingBadge'
import { GamepadRating } from '../../molecules/GamepadRating'
import { formatReleaseDate } from '../../../utils/game'
import type { GameDetailResponse } from '../../../types/game'

interface GameDetailsHeaderProps {
  game: GameDetailResponse
  onAddToWantToPlay: () => void
  addLoading: boolean
  added: boolean
  userRating: number | null
  onRate: (value: number | null) => void
  ratingLoading: boolean
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 32px;
  align-items: start;

  @media (max-width: 719px) {
    grid-template-columns: 1fr;
  }
`

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const RatingsRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`

const GenresRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

const MetaText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${colors.textSecondary};
`

const YourRatingLabel = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${colors.textSecondary};
  font-weight: 500;
`

const RatingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const RemoveRatingButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.75rem;
  color: ${colors.textSecondary};
  transition: color 0.15s;

  &:hover {
    color: ${colors.error};
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`

export function GameDetailsHeader({
  game,
  onAddToWantToPlay,
  addLoading,
  added,
  userRating,
  onRate,
  ratingLoading,
}: GameDetailsHeaderProps) {
  const releaseDateFormatted = formatReleaseDate(game.releaseDate)
  const metaParts = [
    releaseDateFormatted,
    game.developers.length > 0 ? game.developers.join(', ') : null,
  ].filter(Boolean)

  return (
    <Grid>
      <GameCover coverUrl={game.coverUrl} name={game.name} size="lg" />

      <Info>
        <div>
          <Typography variant="h4" component="h1" sx={{ color: colors.textPrimary, fontWeight: 700 }}>
            {game.name}
          </Typography>
          {metaParts.length > 0 && <MetaText>{metaParts.join(' · ')}</MetaText>}
        </div>

        <RatingsRow>
          <RatingBadge label={texts.gameDetails.ratingRawgLabel} value={game.rawgRating} />
          <RatingBadge
            label={texts.gameDetails.ratingPlatformLabel}
            value={game.platformAverageRating}
            comingSoon
          />
        </RatingsRow>

        {game.genres.length > 0 && (
          <GenresRow>
            {game.genres.map((genre) => (
              <Chip
                key={genre}
                label={genre}
                variant="outlined"
                size="small"
                sx={{
                  color: colors.primary,
                  borderColor: colors.primary,
                  fontSize: '0.75rem',
                }}
              />
            ))}
          </GenresRow>
        )}

        {game.platforms.length > 0 && (
          <MetaText>
            <strong style={{ color: colors.textPrimary }}>{texts.gameDetails.platformsLabel}:</strong>{' '}
            {game.platforms.join(', ')}
          </MetaText>
        )}

        <div>
          <YourRatingLabel>{texts.gameDetails.yourRatingLabel}</YourRatingLabel>
          <RatingRow>
            <GamepadRating value={userRating} onChange={ratingLoading ? undefined : onRate} />
            {userRating != null && (
              <RemoveRatingButton onClick={() => onRate(null)} disabled={ratingLoading}>
                {texts.gameDetails.removeRating}
              </RemoveRatingButton>
            )}
          </RatingRow>
        </div>

        <Button
          variant="contained"
          startIcon={
            addLoading
              ? <CircularProgress size={16} sx={{ color: colors.buttonPrimaryText }} />
              : added
                ? <CheckIcon />
                : <AddIcon />
          }
          disabled={addLoading || added}
          onClick={onAddToWantToPlay}
          sx={{ alignSelf: 'flex-start' }}
        >
          {added ? texts.gameDetails.addedToWantToPlay : texts.gameDetails.addToWantToPlay}
        </Button>
      </Info>
    </Grid>
  )
}

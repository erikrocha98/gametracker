import AddIcon from '@mui/icons-material/Add'
import { Button, Chip, Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { GameCover } from '../../atoms/GameCover'
import { RatingBadge } from '../../molecules/RatingBadge'
import { formatReleaseDate } from '../../../utils/game'
import type { GameDetailResponse } from '../../../types/game'

interface GameDetailsHeaderProps {
  game: GameDetailResponse
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

export function GameDetailsHeader({ game }: GameDetailsHeaderProps) {
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

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ alignSelf: 'flex-start' }}
        >
          {texts.gameDetails.addToWantToPlay}
        </Button>
      </Info>
    </Grid>
  )
}

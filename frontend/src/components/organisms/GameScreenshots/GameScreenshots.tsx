import { Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'

interface GameScreenshotsProps {
  screenshots: string[]
}

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
`

const Screenshot = styled.img`
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: 8px;
  display: block;
`

export function GameScreenshots({ screenshots }: GameScreenshotsProps) {
  return (
    <Section>
      <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
        {texts.gameDetails.screenshotsTitle}
      </Typography>

      {screenshots.length === 0 ? (
        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
          {texts.gameDetails.noScreenshots}
        </Typography>
      ) : (
        <Grid>
          {screenshots.map((url, index) => (
            <Screenshot
              key={url}
              src={url}
              alt={`Screenshot ${index + 1}`}
            />
          ))}
        </Grid>
      )}
    </Section>
  )
}

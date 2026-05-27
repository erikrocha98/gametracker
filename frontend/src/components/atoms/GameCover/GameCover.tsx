import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'

type CoverSize = 'sm' | 'md' | 'lg'

interface GameCoverProps {
  coverUrl: string | null
  name: string
  size?: CoverSize
}

const sizes: Record<CoverSize, { width: string; height: string; iconSize: string }> = {
  sm: { width: '40px', height: '54px', iconSize: '20px' },
  md: { width: '64px', height: '86px', iconSize: '28px' },
  lg: { width: '240px', height: '320px', iconSize: '48px' },
}

const Wrapper = styled.div<{ $size: CoverSize }>`
  width: ${({ $size }) => sizes[$size].width};
  height: ${({ $size }) => sizes[$size].height};
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: ${colors.placeholderBackground};
  display: flex;
  align-items: center;
  justify-content: center;
`

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`

const Fallback = styled(SportsEsportsIcon)<{ $size: CoverSize }>`
  color: ${colors.textSecondary};
  font-size: ${({ $size }) => sizes[$size].iconSize} !important;
`

export function GameCover({ coverUrl, name, size = 'md' }: GameCoverProps) {
  if (coverUrl) {
    return (
      <Wrapper $size={size}>
        <Img src={coverUrl} alt={name} />
      </Wrapper>
    )
  }
  return (
    <Wrapper $size={size}>
      <Fallback $size={size} aria-hidden />
    </Wrapper>
  )
}

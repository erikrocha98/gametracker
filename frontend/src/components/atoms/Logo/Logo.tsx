import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import Typography from '@mui/material/Typography'
import styled from 'styled-components'
import { texts } from '../../../constants/texts'

interface LogoProps {
  size?: 'sm' | 'md'
}

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const IconBox = styled.div<{ $size: 'sm' | 'md' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #22c55e;
  border-radius: 10px;
  width: ${({ $size }) => ($size === 'md' ? '44px' : '32px')};
  height: ${({ $size }) => ($size === 'md' ? '44px' : '32px')};
  color: #000;
`

export function Logo({ size = 'md' }: LogoProps) {
  return (
    <Container>
      <IconBox $size={size}>
        <SportsEsportsIcon fontSize={size === 'md' ? 'medium' : 'small'} />
      </IconBox>
      <Typography
        variant={size === 'md' ? 'h5' : 'subtitle1'}
        sx={{ fontWeight: 700, color: 'text.primary' }}
      >
        {texts.brand.name}
      </Typography>
    </Container>
  )
}

import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import { Rating } from '@mui/material'
import { colors } from '../../../theme/colors'

interface GamepadRatingProps {
  value: number | null
  onChange?: (value: number | null) => void
  readOnly?: boolean
  size?: 'small' | 'medium'
}

export function GamepadRating({ value, onChange, readOnly = false, size = 'medium' }: GamepadRatingProps) {
  return (
    <Rating
      value={value}
      precision={0.5}
      readOnly={readOnly}
      size={size}
      onChange={onChange ? (_, newValue) => onChange(newValue) : undefined}
      icon={<SportsEsportsIcon fontSize="inherit" sx={{ color: colors.primary }} />}
      emptyIcon={<SportsEsportsIcon fontSize="inherit" sx={{ color: colors.inputBorder }} />}
    />
  )
}

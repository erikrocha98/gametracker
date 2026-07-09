import MuiAvatar from '@mui/material/Avatar'
import { colors } from '../../../theme/colors'

interface AvatarProps {
  username: string
  size?: number
}

function getInitials(username: string): string {
  const parts = username.trim().split(/[\s_]+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

export function Avatar({ username, size = 64 }: AvatarProps) {
  return (
    <MuiAvatar
      sx={{
        width: size,
        height: size,
        bgcolor: colors.primary,
        color: colors.buttonPrimaryText,
        fontWeight: 700,
        fontSize: size / 2.4,
      }}
    >
      {getInitials(username)}
    </MuiAvatar>
  )
}

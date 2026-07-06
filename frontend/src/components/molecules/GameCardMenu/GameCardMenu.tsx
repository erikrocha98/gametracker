import MoreVertIcon from '@mui/icons-material/MoreVert'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material'
import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { GamepadRating } from '../GamepadRating'

interface GameCardMenuProps {
  rating: number | null
  onRate: (value: number | null) => void
  onDelete: () => void
}

const MenuButton = styled(IconButton)`
  position: absolute !important;
  bottom: 8px !important;
  right: 8px !important;
  background-color: ${colors.overlayCardAction} !important;
  color: ${colors.textPrimary} !important;
  padding: 4px !important;

  &:hover {
    color: ${colors.primary} !important;
  }
`

export function GameCardMenu({ rating, onRate, onDelete }: GameCardMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [rateOpen, setRateOpen] = useState(false)
  const menuOpen = Boolean(anchorEl)

  const stopEvent = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleOpenMenu = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setAnchorEl(e.currentTarget)
  }, [])

  const handleCloseMenu = useCallback(() => setAnchorEl(null), [])

  const handleRateClick = useCallback(() => {
    setAnchorEl(null)
    setRateOpen(true)
  }, [])

  const handleDeleteClick = useCallback(() => {
    setAnchorEl(null)
    onDelete()
  }, [onDelete])

  const handleCloseDialog = useCallback(() => setRateOpen(false), [])

  const handleChangeRating = useCallback(
    (value: number | null) => {
      onRate(value)
      setRateOpen(false)
    },
    [onRate],
  )

  const handleRemoveRating = useCallback(() => {
    onRate(null)
    setRateOpen(false)
  }, [onRate])

  return (
    <>
      <MenuButton
        size="small"
        aria-label={texts.myGames.menuAriaLabel}
        onClick={handleOpenMenu}
      >
        <MoreVertIcon fontSize="small" />
      </MenuButton>

      <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleCloseMenu} onClick={stopEvent}>
        <MenuItem onClick={handleRateClick}>{texts.myGames.menuRate}</MenuItem>
        <MenuItem disabled>{texts.myGames.menuReview}</MenuItem>
        <MenuItem disabled>{texts.myGames.menuAddToList}</MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: colors.error }}>
          {texts.myGames.menuDelete}
        </MenuItem>
      </Menu>

      <Dialog open={rateOpen} onClose={handleCloseDialog} onClick={stopEvent}>
        <DialogTitle sx={{ color: colors.textPrimary }}>{texts.myGames.rateDialogTitle}</DialogTitle>
        <DialogContent>
          <GamepadRating value={rating} onChange={handleChangeRating} />
        </DialogContent>
        <DialogActions>
          {rating != null && (
            <Button onClick={handleRemoveRating} sx={{ color: colors.error }}>
              {texts.myGames.rateDialogRemove}
            </Button>
          )}
          <Button onClick={handleCloseDialog} sx={{ color: colors.textSecondary }}>
            {texts.myGames.rateDialogClose}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

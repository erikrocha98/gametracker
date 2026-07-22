import MenuIcon from '@mui/icons-material/Menu'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material'
import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import type { GameStatus } from '../../../types/game'
import { GamepadRating } from '../GamepadRating'

interface GameCardMenuProps {
  status: GameStatus
  rating: number | null
  onStatusChange: (status: GameStatus) => void
  onRate: (value: number | null) => void
  onDelete: () => void
  onAddToList?: () => void
  onReview?: () => void
}

const STATUS_OPTIONS: { value: GameStatus; label: string }[] = [
  { value: 'want_to_play', label: texts.myGames.statusWantToPlay },
  { value: 'playing', label: texts.myGames.statusPlaying },
  { value: 'finished', label: texts.myGames.statusFinished },
]

const Footer = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  padding: 6px 8px;
  background-color: ${colors.overlayCardAction};
  /* escondida deslizando para fora da capa (o CoverWrapper tem overflow: hidden) */
  transform: translateY(100%);
  transition: transform 0.15s;

  &[data-open='true'] {
    transform: translateY(0);
  }
`

const MenuButton = styled(IconButton)`
  color: ${colors.textPrimary} !important;
  padding: 4px !important;

  &:hover {
    color: ${colors.primary} !important;
  }
`

export function GameCardMenu({ status, rating, onStatusChange, onRate, onDelete, onAddToList, onReview }: GameCardMenuProps) {
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

  const handleStatusClick = useCallback(
    (value: GameStatus) => {
      setAnchorEl(null)
      onStatusChange(value)
    },
    [onStatusChange],
  )

  const handleRateClick = useCallback(() => {
    setAnchorEl(null)
    setRateOpen(true)
  }, [])

  const handleDeleteClick = useCallback(() => {
    setAnchorEl(null)
    onDelete()
  }, [onDelete])

  const handleAddToListClick = useCallback(() => {
    setAnchorEl(null)
    onAddToList?.()
  }, [onAddToList])

  const handleReviewClick = useCallback(() => {
    setAnchorEl(null)
    onReview?.()
  }, [onReview])

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
      <Footer className="game-card-footer" data-open={menuOpen}>
        <MenuButton
          size="small"
          aria-label={texts.myGames.menuAriaLabel}
          onClick={handleOpenMenu}
        >
          <MenuIcon fontSize="small" />
        </MenuButton>
      </Footer>

      <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleCloseMenu} onClick={stopEvent} disableRestoreFocus>
        {STATUS_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            selected={status === option.value}
            onClick={() => handleStatusClick(option.value)}
          >
            {option.label}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={handleRateClick}>{texts.myGames.menuRate}</MenuItem>
        <MenuItem disabled={!onReview} onClick={handleReviewClick}>{texts.myGames.menuReview}</MenuItem>
        <MenuItem disabled={!onAddToList} onClick={handleAddToListClick}>
          {texts.myGames.menuAddToList}
        </MenuItem>
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

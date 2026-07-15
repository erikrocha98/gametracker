import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { getLists, addGameToList } from '../../../services/lists'
import type { GameList } from '../../../types/list'
import { EmptyState } from '../../molecules/EmptyState'
import { FeedbackModal } from '../../molecules/FeedbackModal'

const MAX_GAMES_PER_LIST = 50

export interface AddToListDialogProps {
  open: boolean
  gameId: string | null
  onClose: () => void
  onAdded?: () => void
}

type Status = 'loading' | 'error' | 'ready'

const StatusWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 24px 0;
`

const StatusText = styled(Typography)`
  padding: 16px;
  text-align: center;
`

const ListName = styled.span`
  color: ${colors.textPrimary};
`

const Count = styled.span`
  color: ${colors.textSecondary};
`

const StateLabel = styled.span`
  color: ${colors.textSecondary};
  font-size: 0.8125rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`

export function AddToListDialog({ open, gameId, onClose, onAdded }: AddToListDialogProps) {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('loading')
  const [lists, setLists] = useState<GameList[]>([])
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; open: boolean }>({
    type: 'success',
    message: '',
    open: false,
  })

  const stopEvent = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  useEffect(() => {
    if (!open || !gameId) return
    let active = true
    setStatus('loading')
    getLists(gameId)
      .then((response) => {
        if (!active) return
        setLists(response.items)
        setStatus('ready')
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [open, gameId])

  const handleSelect = useCallback(
    async (list: GameList) => {
      if (!gameId) return
      try {
        await addGameToList(list.id, gameId)
        setLists((prev) =>
          prev.map((item) =>
            item.id === list.id
              ? { ...item, containsGame: true, gameCount: item.gameCount + 1 }
              : item,
          ),
        )
        onAdded?.()
        setFeedback({ type: 'success', message: texts.addToList.successMessage, open: true })
      } catch (error) {
        const responseStatus = error instanceof Response ? error.status : undefined
        if (responseStatus === 409) {
          setLists((prev) =>
            prev.map((item) => (item.id === list.id ? { ...item, containsGame: true } : item)),
          )
          setFeedback({ type: 'error', message: texts.addToList.alreadyInListError, open: true })
        } else if (responseStatus === 422) {
          setFeedback({ type: 'error', message: texts.addToList.listFullError, open: true })
        } else {
          setFeedback({ type: 'error', message: texts.addToList.errorMessage, open: true })
        }
      }
    },
    [gameId, onAdded],
  )

  return (
    <>
      <Dialog open={open} onClose={onClose} onClick={stopEvent} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: colors.textPrimary }}>{texts.addToList.dialogTitle}</DialogTitle>
        <DialogContent>
          {status === 'loading' && (
            <StatusWrapper>
              <CircularProgress size={24} sx={{ color: colors.primary }} />
            </StatusWrapper>
          )}
          {status === 'error' && (
            <StatusText variant="body2" sx={{ color: colors.error }}>
              {texts.addToList.loadError}
            </StatusText>
          )}
          {status === 'ready' && lists.length === 0 && (
            <EmptyState
              title={texts.addToList.emptyTitle}
              description={texts.addToList.emptyDescription}
              actionLabel={texts.addToList.createListCta}
              onAction={() => navigate('/my-lists')}
            />
          )}
          {status === 'ready' && lists.length > 0 && (
            <List>
              {lists.map((list) => {
                const isFull = list.gameCount >= MAX_GAMES_PER_LIST
                const disabled = Boolean(list.containsGame) || isFull
                return (
                  <ListItem
                    key={list.id}
                    disablePadding
                    secondaryAction={
                      list.containsGame ? (
                        <StateLabel>
                          <CheckIcon fontSize="small" sx={{ color: colors.success }} />
                          {texts.addToList.alreadyInListLabel}
                        </StateLabel>
                      ) : isFull ? (
                        <StateLabel>{texts.addToList.listFullLabel}</StateLabel>
                      ) : undefined
                    }
                  >
                    <ListItemButton disabled={disabled} onClick={() => handleSelect(list)}>
                      <ListItemText
                        primary={<ListName>{list.name}</ListName>}
                        secondary={<Count>{texts.addToList.countLabel(list.gameCount)}</Count>}
                      />
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>

      <FeedbackModal
        type={feedback.type}
        message={feedback.message}
        open={feedback.open}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      />
    </>
  )
}

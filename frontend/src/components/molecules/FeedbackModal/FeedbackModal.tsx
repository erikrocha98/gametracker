import { useEffect, useCallback } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'

export interface FeedbackModalProps {
  type: 'success' | 'error'
  message: string
  open: boolean
  onClose: () => void
  autoCloseDuration?: number
}

const Content = styled(DialogContent)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 32px 32px !important;
  text-align: center;
  min-width: 280px;
`

const StyledIcon = styled.div<{ $type: 'success' | 'error' }>`
  color: ${({ $type }) => ($type === 'success' ? colors.success : colors.error)};
  display: flex;
  font-size: 56px;

  & svg {
    font-size: inherit;
  }
`

const Message = styled(Typography)<{ $type: 'success' | 'error' }>`
  color: ${({ $type }) => ($type === 'success' ? colors.success : colors.error)} !important;
  font-weight: 600 !important;
`

export function FeedbackModal({
  type,
  message,
  open,
  onClose,
  autoCloseDuration = 3000,
}: FeedbackModalProps) {
  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open || type !== 'success') return
    const timer = setTimeout(handleClose, autoCloseDuration)
    return () => clearTimeout(timer)
  }, [open, type, autoCloseDuration, handleClose])

  return (
    <Dialog
      open={open}
      onClose={type === 'success' ? handleClose : undefined}
      maxWidth="xs"
    >
      <Content>
        {type === 'error' && (
          <IconButton
            onClick={handleClose}
            size="small"
            aria-label={texts.feedbackModal.closeAriaLabel}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
        <StyledIcon $type={type}>
          {type === 'success' ? (
            <CheckCircleOutlineIcon fontSize="inherit" />
          ) : (
            <ErrorOutlineIcon fontSize="inherit" />
          )}
        </StyledIcon>
        <Message $type={type} variant="body1">
          {message}
        </Message>
      </Content>
    </Dialog>
  )
}

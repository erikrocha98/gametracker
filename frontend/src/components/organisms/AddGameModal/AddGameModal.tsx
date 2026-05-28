import { useState, useCallback } from 'react'
import { CircularProgress, Dialog, DialogContent, DialogTitle, Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { useDebounce } from '../../../hooks/useDebounce'
import { useGameSearch } from '../../../hooks/useGameSearch'
import { addToWantToPlay } from '../../../services/games'
import { SearchBar } from '../../molecules/SearchBar'
import { SelectableGameItem } from '../../molecules/SelectableGameItem'
import { FeedbackModal } from '../../molecules/FeedbackModal'

export interface AddGameModalProps {
  open: boolean
  onClose: () => void
  onAdded?: () => void
}

const ResultsWrapper = styled.div`
  margin-top: 12px;
  max-height: 300px;
  overflow-y: auto;
`

const StatusText = styled(Typography)`
  padding: 16px;
  text-align: center;
`

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 24px 0;
`

export function AddGameModal({ open, onClose, onAdded }: AddGameModalProps) {
  const [query, setQuery] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; open: boolean }>({
    type: 'success',
    message: '',
    open: false,
  })
  const debouncedQuery = useDebounce(query, 300)
  const { status, results } = useGameSearch(debouncedQuery)

  const handleClear = useCallback(() => setQuery(''), [])

  const handleClose = useCallback(() => {
    setQuery('')
    onClose()
  }, [onClose])

  const handleSelect = useCallback(async (gameId: string) => {
    try {
      await addToWantToPlay(gameId)
      handleClose()
      onAdded?.()
      setFeedback({ type: 'success', message: texts.addGame.successMessage, open: true })
    } catch {
      setFeedback({ type: 'error', message: texts.addGame.errorMessage, open: true })
    }
  }, [handleClose, onAdded])

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: colors.textPrimary }}>
          {texts.addGame.modalTitle}
        </DialogTitle>
        <DialogContent>
          <SearchBar
            value={query}
            onChange={setQuery}
            onClear={handleClear}
          />

          <ResultsWrapper>
            {status === 'loading' && (
              <LoadingWrapper>
                <CircularProgress size={24} sx={{ color: colors.primary }} />
              </LoadingWrapper>
            )}
            {status === 'empty' && (
              <StatusText variant="body2" sx={{ color: colors.textSecondary }}>
                {texts.search.noResults}
              </StatusText>
            )}
            {status === 'error' && (
              <StatusText variant="body2" sx={{ color: colors.error }}>
                {texts.search.error}
              </StatusText>
            )}
            {status === 'success' && results.map((result) => (
              <SelectableGameItem
                key={result.id}
                result={result}
                onClick={() => handleSelect(result.id)}
              />
            ))}
          </ResultsWrapper>
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

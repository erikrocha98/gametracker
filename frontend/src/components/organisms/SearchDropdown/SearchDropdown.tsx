import { CircularProgress } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { SearchResultItem } from '../../molecules/SearchResultItem'
import type { GameSearchResult, SearchStatus } from '../../../types/game'

interface SearchDropdownProps {
  status: SearchStatus
  results: GameSearchResult[]
  onSelect: () => void
  onRetry: () => void
}

const Panel = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background-color: ${colors.backgroundPaper};
  border: 1px solid ${colors.inputBorder};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 24px ${colors.overlayScrim};
  z-index: 100;
  max-height: 360px;
  overflow-y: auto;
`

const Message = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  color: ${colors.textSecondary};
  font-size: 0.875rem;
`

const RetryButton = styled.button`
  background: none;
  border: none;
  color: ${colors.primary};
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
`

export function SearchDropdown({ status, results, onSelect, onRetry }: SearchDropdownProps) {
  if (status === 'idle') return null

  if (status === 'loading') {
    return (
      <Panel>
        <Message>
          <CircularProgress size={16} sx={{ color: colors.primary }} />
          {texts.search.loading}
        </Message>
      </Panel>
    )
  }

  if (status === 'empty') {
    return (
      <Panel>
        <Message>{texts.search.noResults}</Message>
      </Panel>
    )
  }

  if (status === 'error') {
    return (
      <Panel>
        <Message>
          {texts.search.error}{' '}
          <RetryButton onClick={onRetry}>{texts.search.retry}</RetryButton>
        </Message>
      </Panel>
    )
  }

  return (
    <Panel>
      {results.map((result) => (
        <SearchResultItem key={result.id} result={result} onClick={onSelect} />
      ))}
    </Panel>
  )
}

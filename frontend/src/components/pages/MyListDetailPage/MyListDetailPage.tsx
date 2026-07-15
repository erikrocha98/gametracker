import { useCallback, useEffect, useState } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import { CircularProgress, Typography } from '@mui/material'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { getList, removeGameFromList } from '../../../services/lists'
import { EmptyState } from '../../molecules/EmptyState'
import { FeedbackModal } from '../../molecules/FeedbackModal'
import { ListGamesGrid } from '../../organisms/ListGamesGrid'
import type { GameListDetail } from '../../../types/list'

const PageWrapper = styled.div`
  padding: 32px 0 64px;
`

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 24px;
  color: ${colors.textSecondary};
  text-decoration: none;
  font-size: 0.875rem;

  &:hover {
    color: ${colors.textPrimary};
  }
`

const Header = styled.div`
  margin-bottom: 32px;
`

const Description = styled(Typography)`
  margin-top: 8px !important;
`

const CenterWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 64px 0;
`

type Status = 'loading' | 'success' | 'not-found' | 'error'

export function MyListDetailPage() {
  const { listId } = useParams<{ listId: string }>()
  const [list, setList] = useState<GameListDetail | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; open: boolean }>({
    type: 'success',
    message: '',
    open: false,
  })

  useEffect(() => {
    getList(Number(listId))
      .then((data) => {
        setList(data)
        setStatus('success')
      })
      .catch((err) => {
        if (err instanceof Response && err.status === 404) {
          setStatus('not-found')
          return
        }
        setStatus('error')
      })
  }, [listId])

  const handleRemove = useCallback(async (gameId: string) => {
    try {
      await removeGameFromList(Number(listId), gameId)
      setList((prev) =>
        prev ? { ...prev, items: prev.items.filter((g) => g.gameId !== gameId) } : prev,
      )
      setFeedback({ type: 'success', message: texts.myLists.removeGameSuccessMessage, open: true })
    } catch {
      setFeedback({ type: 'error', message: texts.myLists.removeGameErrorMessage, open: true })
    }
  }, [listId])

  if (status === 'loading') {
    return (
      <CenterWrapper>
        <CircularProgress size={32} sx={{ color: colors.primary }} />
      </CenterWrapper>
    )
  }

  if (status === 'error') {
    return (
      <PageWrapper>
        <BackLink to="/my-lists">
          <ArrowBackIcon fontSize="small" />
          {texts.myLists.detailBackLabel}
        </BackLink>
        <Typography variant="body2" sx={{ color: colors.error }}>
          {texts.myLists.detailLoadError}
        </Typography>
      </PageWrapper>
    )
  }

  if (status === 'not-found' || list === null) {
    return (
      <PageWrapper>
        <BackLink to="/my-lists">
          <ArrowBackIcon fontSize="small" />
          {texts.myLists.detailBackLabel}
        </BackLink>
        <EmptyState
          icon={<SearchOffIcon sx={{ fontSize: 48, color: colors.textSecondary }} />}
          title={texts.myLists.detailNotFoundTitle}
          description={texts.myLists.detailNotFoundDescription}
        />
      </PageWrapper>
    )
  }

  return (
    <>
      <PageWrapper>
        <BackLink to="/my-lists">
          <ArrowBackIcon fontSize="small" />
          {texts.myLists.detailBackLabel}
        </BackLink>

        <Header>
          <Typography variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700 }}>
            {list.name}
          </Typography>
          {list.description && (
            <Description variant="body1" sx={{ color: colors.textSecondary }}>
              {list.description}
            </Description>
          )}
        </Header>

        <ListGamesGrid items={list.items} onRemove={handleRemove} />
      </PageWrapper>

      <FeedbackModal
        type={feedback.type}
        message={feedback.message}
        open={feedback.open}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      />
    </>
  )
}

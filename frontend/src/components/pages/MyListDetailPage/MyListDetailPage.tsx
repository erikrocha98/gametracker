import { useEffect, useState } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import { CircularProgress, Typography } from '@mui/material'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { getLists } from '../../../services/lists'
import { EmptyState } from '../../molecules/EmptyState'
import type { GameList } from '../../../types/list'

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
  const [list, setList] = useState<GameList | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    const id = Number(listId)
    getLists()
      .then((data) => {
        const found = data.items.find((l) => l.id === id) ?? null
        setList(found)
        setStatus(found ? 'success' : 'not-found')
      })
      .catch(() => setStatus('error'))
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

      <EmptyState
        icon={<SportsEsportsIcon sx={{ fontSize: 48, color: colors.textSecondary }} />}
        title={texts.myLists.detailGamesEmptyTitle}
        description={texts.myLists.detailGamesEmptyDescription}
      />
    </PageWrapper>
  )
}

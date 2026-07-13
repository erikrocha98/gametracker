import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import { CircularProgress, Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { EmptyState } from '../../molecules/EmptyState'
import { ListCard } from '../../molecules/ListCard'
import type { GameList } from '../../../types/list'

interface MyListsGridProps {
  items: GameList[]
  loading: boolean
  error: boolean
  onEdit: (list: GameList) => void
  onDelete: (list: GameList) => void
  onCreate: () => void
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
`

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 48px 0;
`

export function MyListsGrid({ items, loading, error, onEdit, onDelete, onCreate }: MyListsGridProps) {
  if (loading) {
    return (
      <LoadingWrapper>
        <CircularProgress size={32} sx={{ color: colors.primary }} />
      </LoadingWrapper>
    )
  }

  if (error) {
    return (
      <Typography variant="body2" sx={{ color: colors.error }}>
        {texts.myLists.loadError}
      </Typography>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<FormatListBulletedIcon sx={{ fontSize: 48, color: colors.textSecondary }} />}
        title={texts.myLists.emptyTitle}
        description={texts.myLists.emptyDescription}
        actionLabel={texts.myLists.createButton}
        onAction={onCreate}
      />
    )
  }

  return (
    <Grid>
      {items.map((list) => (
        <ListCard
          key={list.id}
          list={list}
          onEdit={() => onEdit(list)}
          onDelete={() => onDelete(list)}
        />
      ))}
    </Grid>
  )
}

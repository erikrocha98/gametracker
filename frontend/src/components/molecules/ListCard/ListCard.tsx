import type { MouseEvent } from 'react'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { IconButton, Tooltip } from '@mui/material'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import type { GameList } from '../../../types/list'

interface ListCardProps {
  list: GameList
  onEdit?: () => void
  onDelete?: () => void
}

const POSTER_SLOTS = 5

const CardLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;
`

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background-color: ${colors.backgroundPaper};
  border: 1px solid ${colors.inputBorder};
  transition: background-color 0.15s;

  &:hover {
    background-color: ${colors.cardHover};
  }
`

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`

const TitleBlock = styled.div`
  min-width: 0;
`

const Name = styled.p`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Description = styled.p`
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: ${colors.textSecondary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Actions = styled.div`
  display: flex;
  flex-shrink: 0;
`

const PosterRow = styled.div`
  display: grid;
  grid-template-columns: repeat(${POSTER_SLOTS}, 1fr);
  gap: 8px;
`

const PosterSlot = styled.div`
  aspect-ratio: 3 / 4;
  border-radius: 4px;
  background-color: ${colors.placeholderBackground};
  border: 1px solid ${colors.inputBorder};
`

const PosterImage = styled.img`
  aspect-ratio: 3 / 4;
  width: 100%;
  border-radius: 4px;
  object-fit: cover;
  display: block;
`

export function ListCard({ list, onEdit, onDelete }: ListCardProps) {
  const handleEdit = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onEdit?.()
  }

  const handleDelete = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete?.()
  }

  return (
    <CardLink to={`/my-lists/${list.id}`} aria-label={`${texts.myLists.openAriaLabel}: ${list.name}`}>
      <Card>
        <HeaderRow>
          <TitleBlock>
            <Tooltip title={list.name} enterDelay={400}>
              <Name>{list.name}</Name>
            </Tooltip>
            {list.description && <Description>{list.description}</Description>}
          </TitleBlock>
          <Actions>
            {onEdit && (
              <IconButton
                size="small"
                aria-label={texts.myLists.editAriaLabel}
                onClick={handleEdit}
                sx={{ color: colors.textSecondary }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                size="small"
                aria-label={texts.myLists.deleteAriaLabel}
                onClick={handleDelete}
                sx={{ color: colors.textSecondary }}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            )}
          </Actions>
        </HeaderRow>
        <PosterRow>
          {Array.from({ length: POSTER_SLOTS }).map((_, i) => {
            const coverUrl = list.coverUrls[i]
            return coverUrl ? (
              <PosterImage key={i} src={coverUrl} alt="" />
            ) : (
              <PosterSlot key={i} />
            )
          })}
        </PosterRow>
      </Card>
    </CardLink>
  )
}

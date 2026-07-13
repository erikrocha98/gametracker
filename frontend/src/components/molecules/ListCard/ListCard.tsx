import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { IconButton } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import type { GameList } from '../../../types/list'

interface ListCardProps {
  list: GameList
  onEdit?: () => void
  onDelete?: () => void
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  margin: 0;
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

export function ListCard({ list, onEdit, onDelete }: ListCardProps) {
  return (
    <Card>
      <HeaderRow>
        <Name>{list.name}</Name>
        <Actions>
          {onEdit && (
            <IconButton
              size="small"
              aria-label={texts.myLists.editAriaLabel}
              onClick={onEdit}
              sx={{ color: colors.textSecondary }}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              size="small"
              aria-label={texts.myLists.deleteAriaLabel}
              onClick={onDelete}
              sx={{ color: colors.textSecondary }}
            >
              <DeleteOutlinedIcon fontSize="small" />
            </IconButton>
          )}
        </Actions>
      </HeaderRow>
      {list.description && <Description>{list.description}</Description>}
    </Card>
  )
}

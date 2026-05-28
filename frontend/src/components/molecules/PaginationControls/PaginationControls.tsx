import { Pagination, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'

export interface PaginationControlsProps {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const PAGE_SIZES = [5, 10, 15, 20]

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  flex-wrap: wrap;
  gap: 12px;
`

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

export function PaginationControls({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const count = Math.ceil(totalItems / pageSize)

  return (
    <Wrapper>
      <LeftGroup>
        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
          {texts.myGames.perPageLabel}
        </Typography>
        <ToggleButtonGroup
          value={pageSize}
          exclusive
          onChange={(_, value: number | null) => {
            if (value !== null) onPageSizeChange(value)
          }}
          size="small"
        >
          {PAGE_SIZES.map((size) => (
            <ToggleButton
              key={size}
              value={size}
              sx={{
                color: colors.textSecondary,
                borderColor: colors.inputBorder,
                fontSize: '0.75rem',
                padding: '2px 10px',
                '&.Mui-selected': {
                  backgroundColor: colors.primary,
                  color: colors.buttonPrimaryText,
                  '&:hover': {
                    backgroundColor: colors.primary,
                  },
                },
              }}
            >
              {size}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </LeftGroup>

      <Pagination
        count={count}
        page={page}
        onChange={(_, value) => onPageChange(value)}
        size="small"
        sx={{
          '& .MuiPaginationItem-root': {
            color: colors.textSecondary,
          },
          '& .Mui-selected': {
            backgroundColor: `${colors.primary} !important`,
            color: colors.buttonPrimaryText,
          },
        }}
      />
    </Wrapper>
  )
}

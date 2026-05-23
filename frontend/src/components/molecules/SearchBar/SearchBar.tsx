import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import { IconButton, InputAdornment, TextField } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  onFocus?: () => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

const StyledField = styled(TextField)`
  & .MuiInputBase-root {
    background-color: ${colors.inputBackground};
    border-radius: 8px;
    font-size: 0.875rem;
  }

  & .MuiOutlinedInput-notchedOutline {
    border-color: ${colors.inputBorder};
  }

  &:hover .MuiOutlinedInput-notchedOutline {
    border-color: ${colors.inputBorderHover};
  }

  & .MuiInputBase-input {
    padding: 8px 0;
    color: ${colors.textPrimary};

    &::placeholder {
      color: ${colors.textSecondary};
      opacity: 1;
    }
  }
`

export function SearchBar({ value, onChange, onClear, onFocus, onKeyDown }: SearchBarProps) {
  return (
    <StyledField
      size="small"
      placeholder={texts.header.searchPlaceholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: colors.textSecondary, fontSize: 18 }} />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={onClear}
                aria-label={texts.header.searchClearAriaLabel}
                edge="end"
              >
                <CloseIcon sx={{ color: colors.textSecondary, fontSize: 16 }} />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
      }}
    />
  )
}

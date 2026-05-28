import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'

export type ActivityFilterValue = 'added' | 'finished' | 'reviews'

interface ActivityFiltersProps {
  value: ActivityFilterValue
  onChange: (value: ActivityFilterValue) => void
}

const Wrapper = styled.div`
  background-color: ${colors.inputBackground};
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 24px;
`

export function ActivityFilters({ value, onChange }: ActivityFiltersProps) {
  return (
    <Wrapper>
      <Tabs
        value={value}
        onChange={(_, newValue: ActivityFilterValue) => onChange(newValue)}
        variant="fullWidth"
        sx={{
          minHeight: 'auto',
          '& .MuiTabs-indicator': { display: 'none' },
          '& .MuiTab-root': {
            borderRadius: '6px',
            minHeight: '36px',
            color: 'text.secondary',
            transition: 'all 0.2s',
            textTransform: 'none',
          },
          '& .Mui-selected': {
            backgroundColor: '#000',
            color: 'text.primary !important',
          },
        }}
      >
        <Tab label={texts.catalog.activityFilters.added} value="added" />
        <Tab label={texts.catalog.activityFilters.finished} value="finished" />
        <Tab label={texts.catalog.activityFilters.reviews} value="reviews" />
      </Tabs>
    </Wrapper>
  )
}

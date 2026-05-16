import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import styled from 'styled-components'

export type AuthTabValue = 'login' | 'signup'

interface AuthTabsProps {
  value: AuthTabValue
  onChange: (value: AuthTabValue) => void
}

const Wrapper = styled.div`
  background-color: #1a1b21;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 24px;
`

export function AuthTabs({ value, onChange }: AuthTabsProps) {
  return (
    <Wrapper>
      <Tabs
        value={value}
        onChange={(_, newValue: AuthTabValue) => onChange(newValue)}
        variant="fullWidth"
        sx={{
          minHeight: 'auto',
          '& .MuiTabs-indicator': { display: 'none' },
          '& .MuiTab-root': {
            borderRadius: '6px',
            minHeight: '36px',
            color: 'text.secondary',
            transition: 'all 0.2s',
          },
          '& .Mui-selected': {
            backgroundColor: '#000',
            color: 'text.primary !important',
          },
        }}
      >
        <Tab label="Entrar" value="login" />
        <Tab label="Criar conta" value="signup" />
      </Tabs>
    </Wrapper>
  )
}

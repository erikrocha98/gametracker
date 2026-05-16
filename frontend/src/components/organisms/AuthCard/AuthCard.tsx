import { useState } from 'react'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import styled from 'styled-components'
import { AuthTabs } from '../../molecules/AuthTabs'
import type { AuthTabValue } from '../../molecules/AuthTabs'
import { SignUpForm } from '../SignUpForm'

const CardWrapper = styled(Paper)`
  padding: 32px;
  width: 100%;
  max-width: 440px;
  box-sizing: border-box;
`

export function AuthCard() {
  const [activeTab, setActiveTab] = useState<AuthTabValue>('signup')

  return (
    <CardWrapper>
      <AuthTabs value={activeTab} onChange={setActiveTab} />
      {activeTab === 'signup' ? (
        <SignUpForm />
      ) : (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
          Em breve
        </Typography>
      )}
    </CardWrapper>
  )
}

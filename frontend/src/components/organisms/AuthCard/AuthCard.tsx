import { useState } from 'react'
import Paper from '@mui/material/Paper'
import styled from 'styled-components'
import { AuthTabs } from '../../molecules/AuthTabs'
import type { AuthTabValue } from '../../molecules/AuthTabs'
import { SignUpForm } from '../SignUpForm'
import { LoginForm } from '../LoginForm'
import type { LoginFormData } from '../LoginForm/loginSchema'

const CardWrapper = styled(Paper)`
  padding: 32px;
  width: 100%;
  max-width: 440px;
  box-sizing: border-box;
`

interface AuthCardProps {
  initialTab?: AuthTabValue
  onLoginSubmit?: (data: LoginFormData) => Promise<void> | void
  loginError?: string | null
}

export function AuthCard({ initialTab = 'signup', onLoginSubmit, loginError }: AuthCardProps) {
  const [activeTab, setActiveTab] = useState<AuthTabValue>(initialTab)

  return (
    <CardWrapper>
      <AuthTabs value={activeTab} onChange={setActiveTab} />
      {activeTab === 'signup' ? (
        <SignUpForm />
      ) : (
        <LoginForm onSubmit={onLoginSubmit} apiError={loginError} />
      )}
    </CardWrapper>
  )
}

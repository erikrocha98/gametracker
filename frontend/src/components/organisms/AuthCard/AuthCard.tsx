import { useCallback, useState } from 'react'
import Alert from '@mui/material/Alert'
import Paper from '@mui/material/Paper'
import styled from 'styled-components'
import { signup } from '../../../services/auth'
import { AuthTabs } from '../../molecules/AuthTabs'
import type { AuthTabValue } from '../../molecules/AuthTabs'
import { SignUpForm } from '../SignUpForm'
import type { SignUpFormData } from '../SignUpForm/signUpSchema'
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
  const [signUpError, setSignUpError] = useState<string | null>(null)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const handleSignUpSubmit = useCallback(async (data: SignUpFormData) => {
    setSignUpError(null)
    try {
      await signup({ username: data.username, email: data.email, password: data.password })
      setSignUpSuccess(true)
      setActiveTab('login')
    } catch {
      setSignUpError('Não foi possível criar a conta. Tente novamente.')
    }
  }, [])

  const handleTabChange = useCallback((tab: AuthTabValue) => {
    setActiveTab(tab)
    setSignUpSuccess(false)
    setSignUpError(null)
  }, [])

  return (
    <CardWrapper>
      {signUpSuccess && activeTab === 'login' && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Conta criada! Faça login para continuar.
        </Alert>
      )}
      <AuthTabs value={activeTab} onChange={handleTabChange} />
      {activeTab === 'signup' ? (
        <SignUpForm onSubmit={handleSignUpSubmit} apiError={signUpError} />
      ) : (
        <LoginForm onSubmit={onLoginSubmit} apiError={loginError} />
      )}
    </CardWrapper>
  )
}

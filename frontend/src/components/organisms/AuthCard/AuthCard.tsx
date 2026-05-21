import { useCallback, useState } from 'react'
import Paper from '@mui/material/Paper'
import styled from 'styled-components'
import { signup } from '../../../services/auth'
import { AuthTabs } from '../../molecules/AuthTabs'
import type { AuthTabValue } from '../../molecules/AuthTabs'
import { FeedbackModal } from '../../molecules/FeedbackModal'
import { SignUpForm } from '../SignUpForm'
import type { SignUpFormData } from '../SignUpForm/signUpSchema'
import { LoginForm } from '../LoginForm'
import type { LoginFormData } from '../LoginForm/loginSchema'
import { texts } from '../../../constants/texts'

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
  const [modalState, setModalState] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSignUpSubmit = useCallback(async (data: SignUpFormData) => {
    try {
      await signup({ username: data.username, email: data.email, password: data.password })
      setModalState({ type: 'success', message: texts.signUp.successMessage })
    } catch {
      setModalState({ type: 'error', message: texts.signUp.errorMessage })
    }
  }, [])

  const handleModalClose = useCallback(() => {
    if (modalState?.type === 'success') {
      setActiveTab('login')
    }
    setModalState(null)
  }, [modalState?.type])

  const handleTabChange = useCallback((tab: AuthTabValue) => {
    setActiveTab(tab)
  }, [])

  return (
    <CardWrapper>
      <AuthTabs value={activeTab} onChange={handleTabChange} />
      {activeTab === 'signup' ? (
        <SignUpForm onSubmit={handleSignUpSubmit} />
      ) : (
        <LoginForm onSubmit={onLoginSubmit} apiError={loginError} />
      )}
      {modalState && (
        <FeedbackModal
          type={modalState.type}
          message={modalState.message}
          open
          onClose={handleModalClose}
        />
      )}
    </CardWrapper>
  )
}

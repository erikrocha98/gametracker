import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthTemplate } from '../../templates/AuthTemplate'
import { AuthCard } from '../../organisms/AuthCard'
import { useAuth } from '../../../contexts/AuthContext'
import type { LoginFormData } from '../../organisms/LoginForm/loginSchema'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loginError, setLoginError] = useState<string | null>(null)

  const handleLoginSubmit = useCallback(
    async (data: LoginFormData) => {
      setLoginError(null)
      try {
        await login(data)
        navigate('/', { replace: true })
      } catch {
        setLoginError('E-mail ou senha inválidos.')
      }
    },
    [login, navigate],
  )

  return (
    <AuthTemplate>
      <AuthCard initialTab="login" onLoginSubmit={handleLoginSubmit} loginError={loginError} />
    </AuthTemplate>
  )
}

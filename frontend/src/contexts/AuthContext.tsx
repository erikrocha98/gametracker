import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getMe, googleLogin as apiGoogleLogin, login as apiLogin, logout as apiLogout } from '../services/auth'
import type { LoginData, User } from '../services/auth'

type AuthStatus = 'loading' | 'authenticated' | 'guest'

interface AuthContextValue {
  user: User | null
  status: AuthStatus
  login: (data: LoginData) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u)
        setStatus('authenticated')
      })
      .catch(() => setStatus('guest'))
  }, [])

  const login = useCallback(async (data: LoginData) => {
    const u = await apiLogin(data)
    setUser(u)
    setStatus('authenticated')
  }, [])

  const loginWithGoogle = useCallback(async (credential: string) => {
    const u = await apiGoogleLogin(credential)
    setUser(u)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
    setStatus('guest')
  }, [])

  return (
    <AuthContext.Provider value={{ user, status, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import Alert from '@mui/material/Alert'
import { useAuth } from '../../../contexts/AuthContext'

export function GoogleButton() {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const handleSuccess = useCallback(
    async (credentialResponse: { credential?: string }) => {
      if (!credentialResponse.credential) return
      try {
        setError(null)
        await loginWithGoogle(credentialResponse.credential)
        navigate('/', { replace: true })
      } catch {
        setError('Não foi possível autenticar com o Google. Tente novamente.')
      }
    },
    [loginWithGoogle, navigate],
  )

  const handleError = useCallback(() => {
    setError('Não foi possível autenticar com o Google. Tente novamente.')
  }, [])

  return (
    <>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        theme="filled_black"
        size="large"
        width="100%"
        text="continue_with"
      />
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </>
  )
}

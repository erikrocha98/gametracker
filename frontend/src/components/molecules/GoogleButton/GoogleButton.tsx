import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import styled from 'styled-components'
import { useAuth } from '../../../contexts/AuthContext'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`

const HiddenGoogle = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0;
  z-index: 2;
  overflow: hidden;
  cursor: pointer;

  & > div,
  & > div > div {
    width: 100% !important;
    height: 100% !important;
  }

  & iframe {
    width: 100% !important;
    height: 100% !important;
    min-width: 100% !important;
    transform: scale(2);
    transform-origin: top left;
  }
`

const VisualButton = styled(Button)`
  &.MuiButton-root {
    background-color: ${colors.inputBackground};
    color: ${colors.textPrimary};
    border: 1px solid ${colors.inputBorder};
    text-transform: none;
    padding: 10px 16px;
    font-size: 15px;
    font-weight: 500;
    gap: 12px;

    &:hover {
      background-color: ${colors.cardHover};
      border-color: ${colors.inputBorderHover};
    }
  }
`

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}

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
        setError(texts.auth.googleError)
      }
    },
    [loginWithGoogle, navigate],
  )

  const handleError = useCallback(() => {
    setError(texts.auth.googleError)
  }, [])

  return (
    <>
      <Wrapper>
        <VisualButton fullWidth startIcon={<GoogleLogo />} aria-hidden="true" tabIndex={-1}>
          {texts.auth.googleButton}
        </VisualButton>
        <HiddenGoogle>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            theme="filled_black"
            size="large"
            width="400"
            text="continue_with"
          />
        </HiddenGoogle>
      </Wrapper>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </>
  )
}

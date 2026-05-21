import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { theme } from './theme/theme'
import { AppRoutes } from './routes/AppRoutes'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <MuiThemeProvider theme={theme}>
            <CssBaseline />
            <StyledThemeProvider theme={theme}>
              <AppRoutes />
            </StyledThemeProvider>
          </MuiThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)

import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import styled from 'styled-components'
import { useAuth } from '../../../contexts/AuthContext'

const Container = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 24px;
`

export function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = useCallback(async () => {
    await logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  return (
    <Container>
      <Typography variant="h5">Olá, {user?.username}!</Typography>
      <Button variant="outlined" onClick={handleLogout}>
        Sair
      </Button>
    </Container>
  )
}

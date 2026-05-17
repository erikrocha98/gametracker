import { Routes, Route, Navigate } from 'react-router-dom'
import { SignUpPage } from '../components/pages/SignUpPage'
import { LoginPage } from '../components/pages/LoginPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

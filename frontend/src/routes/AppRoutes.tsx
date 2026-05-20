import { Routes, Route, Navigate } from 'react-router-dom'
import { SignUpPage } from '../components/pages/SignUpPage'
import { LoginPage } from '../components/pages/LoginPage'
import { HomePage } from '../components/pages/HomePage'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

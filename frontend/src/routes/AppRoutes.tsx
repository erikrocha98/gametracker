import { Routes, Route, Navigate } from 'react-router-dom'
import { SignUpPage } from '../components/pages/SignUpPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="*" element={<Navigate to="/signup" replace />} />
    </Routes>
  )
}

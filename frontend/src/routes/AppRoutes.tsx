import { Routes, Route, Navigate } from 'react-router-dom'
import { SignUpPage } from '../components/pages/SignUpPage'
import { LoginPage } from '../components/pages/LoginPage'
import { CatalogPage } from '../components/pages/CatalogPage'
import { ComingSoonPage } from '../components/pages/ComingSoonPage'
import { MainTemplate } from '../components/templates/MainTemplate'
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
            <MainTemplate>
              <CatalogPage />
            </MainTemplate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/adicionar"
        element={
          <ProtectedRoute>
            <MainTemplate>
              <ComingSoonPage />
            </MainTemplate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <MainTemplate>
              <ComingSoonPage />
            </MainTemplate>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

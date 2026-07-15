import { Routes, Route, Navigate } from 'react-router-dom'
import { SignUpPage } from '../components/pages/SignUpPage'
import { LoginPage } from '../components/pages/LoginPage'
import { CatalogPage } from '../components/pages/CatalogPage'
import { ComingSoonPage } from '../components/pages/ComingSoonPage'
import { GameDetailsPage } from '../components/pages/GameDetailsPage'
import { MyGamesPage } from '../components/pages/MyGamesPage'
import { MyListsPage } from '../components/pages/MyListsPage'
import { MyListDetailPage } from '../components/pages/MyListDetailPage'
import { ProfilePage } from '../components/pages/ProfilePage'
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
        path="/my-games"
        element={
          <ProtectedRoute>
            <MainTemplate>
              <MyGamesPage />
            </MainTemplate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-lists"
        element={
          <ProtectedRoute>
            <MainTemplate>
              <MyListsPage />
            </MainTemplate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-lists/:listId"
        element={
          <ProtectedRoute>
            <MainTemplate>
              <MyListDetailPage />
            </MainTemplate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviews"
        element={
          <ProtectedRoute>
            <MainTemplate>
              <ComingSoonPage />
            </MainTemplate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MainTemplate>
              <ProfilePage />
            </MainTemplate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/games/:gameId"
        element={
          <ProtectedRoute>
            <MainTemplate>
              <GameDetailsPage />
            </MainTemplate>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

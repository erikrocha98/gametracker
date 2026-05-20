import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'

const mockUseAuth = { status: 'loading' as 'loading' | 'authenticated' | 'guest' }

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
}))

function renderProtected(status: 'loading' | 'authenticated' | 'guest') {
  mockUseAuth.status = status
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

test('renders children when authenticated', () => {
  renderProtected('authenticated')
  expect(screen.getByText('Protected Content')).toBeInTheDocument()
})

test('redirects to /login when guest', () => {
  renderProtected('guest')
  expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  expect(screen.getByText('Login Page')).toBeInTheDocument()
})

test('renders nothing while loading', () => {
  const { container } = renderProtected('loading')
  expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  expect(container.firstChild).toBeNull()
})

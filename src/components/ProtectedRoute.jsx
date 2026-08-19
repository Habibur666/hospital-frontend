import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Wrap a route element in this to require login (and optionally specific roles). */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (roles && !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

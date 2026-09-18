import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDefaultRoute } from '../config/nav'

/** Wrap a route element in this to require login (and optionally specific roles). */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (roles && !roles.includes(role)) {
    // Send them to a page THEIR role is actually allowed to see —
    // redirecting everyone to /dashboard was wrong, since /dashboard
    // itself is admin-only and would bounce non-admins right back out
    // (an infinite redirect loop for doctors, patients, etc).
    return <Navigate to={getDefaultRoute(role)} replace />
  }
  return children
}

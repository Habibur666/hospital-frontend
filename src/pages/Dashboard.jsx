import { useAuth } from '../context/AuthContext'
import AdminDashboard from './AdminDashboard'
import DoctorDashboard from './DoctorDashboard'

/**
 * The /dashboard route shows a different view depending on role — admins
 * see hospital-wide stats (revenue, all departments), doctors see only
 * their own schedule (never hospital revenue or other doctors' numbers).
 */
export default function Dashboard() {
  const { role } = useAuth()

  if (role === 'doctor') return <DoctorDashboard />
  return <AdminDashboard />
}

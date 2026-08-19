import { LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ROLE_LABELS } from '../../config/nav'
import { useNavigate } from 'react-router-dom'

export default function Topbar({ title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-6">
      <h1 className="font-display text-lg font-semibold text-ink">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 py-1.5 pl-2 pr-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-primary-500">
            <User size={14} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-ink">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-slate">{ROLE_LABELS[user?.role] || user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-slate hover:bg-canvas hover:text-danger-500"
          title="Log out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}

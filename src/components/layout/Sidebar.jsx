import { NavLink } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import { NAV_GROUPS } from '../../config/nav'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar() {
  const { role } = useAuth()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-100 bg-white md:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-white">
          <HeartPulse size={18} />
        </div>
        <div>
          <p className="font-display text-sm font-bold leading-tight text-ink">MediCore HMS</p>
          <p className="text-xs text-slate">Hospital Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => !item.roles || item.roles.includes(role))
          if (visibleItems.length === 0) return null
          return (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-slate hover:bg-canvas hover:text-ink'
                      }`
                    }
                  >
                    <item.icon size={17} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

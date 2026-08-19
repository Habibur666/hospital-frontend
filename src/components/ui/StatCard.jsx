export default function StatCard({ label, value, icon: Icon, accent = 'primary', suffix }) {
  const accentBar = {
    primary: 'bg-primary-500',
    accent: 'bg-accent-400',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    info: 'bg-info-500',
  }[accent]

  const iconBg = {
    primary: 'bg-primary-50 text-primary-500',
    accent: 'bg-accent-100 text-accent-500',
    success: 'bg-success-50 text-success-500',
    warning: 'bg-warning-50 text-warning-500',
    danger: 'bg-danger-50 text-danger-500',
    info: 'bg-info-50 text-info-500',
  }[accent]

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <span className={`absolute inset-x-0 top-0 h-1 ${accentBar}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">
            {value}
            {suffix && <span className="ml-1 text-sm font-normal text-slate">{suffix}</span>}
          </p>
        </div>
        {Icon && (
          <div className={`rounded-lg p-2.5 ${iconBg}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  )
}

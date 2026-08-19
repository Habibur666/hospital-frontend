const STYLE_MAP = {
  // status word -> tailwind classes
  approved: 'bg-success-50 text-success-500',
  completed: 'bg-success-50 text-success-500',
  paid: 'bg-success-50 text-success-500',
  active: 'bg-success-50 text-success-500',
  available: 'bg-success-50 text-success-500',
  discharged: 'bg-success-50 text-success-500',
  read: 'bg-success-50 text-success-500',

  pending: 'bg-warning-50 text-warning-500',
  scheduled: 'bg-warning-50 text-warning-500',
  requested: 'bg-warning-50 text-warning-500',
  occupied: 'bg-warning-50 text-warning-500',
  low_stock: 'bg-warning-50 text-warning-500',
  unread: 'bg-warning-50 text-warning-500',
  admitted: 'bg-warning-50 text-warning-500',
  rescheduled: 'bg-warning-50 text-warning-500',

  cancelled: 'bg-danger-50 text-danger-500',
  rejected: 'bg-danger-50 text-danger-500',
  inactive: 'bg-danger-50 text-danger-500',
  critical: 'bg-danger-50 text-danger-500',
  unpaid: 'bg-danger-50 text-danger-500',
  expired: 'bg-danger-50 text-danger-500',

  in_progress: 'bg-info-50 text-info-500',
  moderate: 'bg-info-50 text-info-500',
  low: 'bg-success-50 text-success-500',
  medium: 'bg-warning-50 text-warning-500',
  high: 'bg-danger-50 text-danger-500',
}

export default function Badge({ value }) {
  if (value === null || value === undefined || value === '') return <span className="text-slate-400">—</span>
  const key = String(value).toLowerCase().replace(/\s+/g, '_')
  const classes = STYLE_MAP[key] || 'bg-slate-100 text-slate'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${classes}`}>
      {String(value).replace(/_/g, ' ')}
    </span>
  )
}

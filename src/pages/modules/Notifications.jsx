import { useState } from 'react'
import CrudPage from '../../components/ui/CrudPage'
import Badge from '../../components/ui/Badge'
import { Check } from 'lucide-react'

const config = {
  title: 'Notifications',
  description: 'In-app notifications sent to you (also mock-emailed to your address on file).',
  endpoint: '/notifications',
  paginated: false,
  searchable: false,
  canCreate: ['super_admin', 'hospital_admin', 'receptionist', 'doctor'],
  canEdit: [],
  canDelete: [],
  columns: [
    { key: 'title', label: 'Title' },
    { key: 'message', label: 'Message' },
    { key: 'is_read', label: 'Status', render: (r) => <Badge value={r.is_read ? 'read' : 'unread'} /> },
    { key: 'created_at', label: 'Sent' },
  ],
  fields: [
    {
      name: 'user_id', label: 'Recipient', required: true, type: 'lookup', endpoint: '/users',
      getLabel: (u) => `${u.first_name} ${u.last_name}`, getSubLabel: (u) => `${u.email} · ${u.role}`,
    },
    { name: 'title', label: 'Title', required: true },
    { name: 'message', label: 'Message', type: 'textarea', required: true, fullWidth: true },
  ],
  extraRowActions: (row, { api, reload, showToast }) =>
    !row.is_read && <MarkReadButton row={row} api={api} reload={reload} showToast={showToast} />,
}

function MarkReadButton({ row, api, reload, showToast }) {
  const [busy, setBusy] = useState(false)
  async function markRead() {
    setBusy(true)
    try {
      await api.patch(`/notifications/${row.id}/read`)
      reload()
    } catch {
      showToast('Could not update notification', 'error')
    } finally {
      setBusy(false)
    }
  }
  return (
    <button onClick={markRead} disabled={busy} className="rounded-md p-1.5 text-slate hover:bg-canvas hover:text-success-500" title="Mark as read">
      <Check size={15} />
    </button>
  )
}

export default function Notifications() {
  return <CrudPage config={config} />
}

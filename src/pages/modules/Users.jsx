import { useState } from 'react'
import { UserPlus, UserCheck, UserX } from 'lucide-react'
import { api, apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import CrudPage from '../../components/ui/CrudPage'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ResourceForm from '../../components/ui/ResourceForm'
import { ROLE_LABELS } from '../../config/nav'

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))

// Fields shown when EDITING an existing user (password isn't editable here).
const EDIT_FIELDS = [
  { name: 'first_name', label: 'First Name', required: true },
  { name: 'last_name', label: 'Last Name', required: true },
  { name: 'phone', label: 'Phone' },
  { name: 'role', label: 'Role', type: 'select', options: ROLE_OPTIONS, required: true },
]

// Fields shown when CREATING a new staff account (needs a password too).
const CREATE_FIELDS = [
  { name: 'first_name', label: 'First Name', required: true },
  { name: 'last_name', label: 'Last Name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone' },
  { name: 'role', label: 'Role', type: 'select', options: ROLE_OPTIONS.filter((r) => r.value !== 'patient'), required: true },
  { name: 'password', label: 'Temporary Password', type: 'password', required: true, hint: '8+ characters. Share this with the new staff member securely.' },
]

const config = {
  title: 'Users',
  description: 'Everyone with a login: staff and patients. Patients register themselves; staff accounts are created here.',
  endpoint: '/users',
  paginated: true,
  searchable: true,
  canCreate: [], // creation handled by the separate "Add Staff Account" button below
  canEdit: ['super_admin', 'hospital_admin'],
  canDelete: ['super_admin'],
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name', render: (r) => `${r.first_name} ${r.last_name}` },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (r) => <Badge value={ROLE_LABELS[r.role] || r.role} /> },
    { key: 'is_active', label: 'Status', render: (r) => <Badge value={r.is_active ? 'active' : 'inactive'} /> },
  ],
  fields: EDIT_FIELDS,
  extraRowActions: (row, { api, reload, showToast }) => (
    <ToggleStatusButton row={row} api={api} reload={reload} showToast={showToast} />
  ),
}

function ToggleStatusButton({ row, api, reload, showToast }) {
  const [busy, setBusy] = useState(false)
  async function toggle() {
    setBusy(true)
    try {
      await api.patch(`/users/${row.id}/status`, { is_active: !row.is_active })
      showToast(`User ${row.is_active ? 'deactivated' : 'activated'}`)
      reload()
    } catch {
      showToast('Could not change user status', 'error')
    } finally {
      setBusy(false)
    }
  }
  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="rounded-md p-1.5 text-slate hover:bg-canvas hover:text-primary-500 disabled:opacity-40"
      title={row.is_active ? 'Deactivate' : 'Activate'}
    >
      {row.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
    </button>
  )
}

export default function Users() {
  const { role } = useAuth()
  const showToast = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const canCreateStaff = ['super_admin', 'hospital_admin'].includes(role)

  async function createStaff(values) {
    try {
      await api.post('/users', values)
      showToast('Staff account created')
      setCreateOpen(false)
      window.location.reload() // simplest way to refresh the underlying CrudPage list
      return { success: true }
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
      return { errors: error?.response?.data?.errors }
    }
  }

  return (
    <div>
      {canCreateStaff && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus size={16} /> Add Staff Account
          </Button>
        </div>
      )}

      <CrudPage config={config} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Staff Account">
        <ResourceForm fields={CREATE_FIELDS} onSubmit={createStaff} onCancel={() => setCreateOpen(false)} submitLabel="Create Account" />
      </Modal>
    </div>
  )
}

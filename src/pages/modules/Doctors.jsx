import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { api, apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import CrudPage from '../../components/ui/CrudPage'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ResourceForm from '../../components/ui/ResourceForm'

// Shown when EDITING an existing doctor — only the doctor-specific
// details. Login email/password aren't changed from here.
const EDIT_FIELDS = [
  { name: 'department_id', label: 'Department', type: 'lookup', endpoint: '/departments', searchable: false, getLabel: (d) => d.name },
  { name: 'specialty', label: 'Specialty' },
  { name: 'qualification', label: 'Qualification' },
  { name: 'experience_years', label: 'Experience (years)', type: 'number' },
  { name: 'consultation_fee', label: 'Consultation Fee', type: 'number', step: '0.01' },
]

// Shown when CREATING a brand new doctor — one form creates the login
// account (role='doctor') AND the doctor profile together, in one step.
const CREATE_FIELDS = [
  { name: 'first_name', label: 'First Name', required: true },
  { name: 'last_name', label: 'Last Name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone' },
  { name: 'password', label: 'Temporary Password', type: 'password', required: true, hint: '8+ characters. Share this with the doctor securely.' },
  { name: 'department_id', label: 'Department', type: 'lookup', endpoint: '/departments', searchable: false, getLabel: (d) => d.name },
  { name: 'specialty', label: 'Specialty' },
  { name: 'qualification', label: 'Qualification' },
  { name: 'experience_years', label: 'Experience (years)', type: 'number' },
  { name: 'consultation_fee', label: 'Consultation Fee', type: 'number', step: '0.01' },
]

const config = {
  title: 'Doctors',
  entityName: 'Doctor',
  description: 'Doctor profiles, linked to their own login account.',
  endpoint: '/doctors',
  paginated: true,
  searchable: true,
  canCreate: [], // creation handled by the separate "Add Doctor" button below
  canEdit: ['super_admin', 'hospital_admin', 'doctor'],
  canDelete: [],
  isOwnRow: (row, user) => ['super_admin', 'hospital_admin'].includes(user?.role) || row.user_id === user?.id,
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name', render: (r) => `Dr. ${r.first_name} ${r.last_name}` },
    { key: 'department_name', label: 'Department' },
    { key: 'specialty', label: 'Specialty' },
    { key: 'experience_years', label: 'Experience', render: (r) => (r.experience_years ? `${r.experience_years} yrs` : '—') },
    { key: 'consultation_fee', label: 'Fee', render: (r) => (r.consultation_fee ? `$${r.consultation_fee}` : '—') },
  ],
  fields: EDIT_FIELDS,
}

export default function Doctors() {
  const { role } = useAuth()
  const showToast = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const canCreateDoctor = ['super_admin', 'hospital_admin'].includes(role)

  async function createDoctor(values) {
    try {
      await api.post('/doctors', values)
      showToast('Doctor account created')
      setCreateOpen(false)
      window.location.reload() // refresh the underlying CrudPage list
      return { success: true }
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
      return { errors: error?.response?.data?.errors }
    }
  }

  return (
    <div>
      {canCreateDoctor && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus size={16} /> Add Doctor
          </Button>
        </div>
      )}

      <CrudPage config={config} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Doctor" width="max-w-2xl">
        <ResourceForm fields={CREATE_FIELDS} onSubmit={createDoctor} onCancel={() => setCreateOpen(false)} submitLabel="Create Doctor" />
      </Modal>
    </div>
  )
}

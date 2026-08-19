import { useEffect, useState, useCallback } from 'react'
import { Plus, Siren } from 'lucide-react'
import { api, apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ResourceForm from '../../components/ui/ResourceForm'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Select } from '../../components/ui/Input'

const FIELDS = [
  { name: 'full_name', label: 'Full Name', required: true },
  { name: 'age', label: 'Age', type: 'number' },
  { name: 'gender', label: 'Gender', type: 'select', options: [
    { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' },
  ] },
  { name: 'condition_note', label: 'Condition', type: 'textarea', fullWidth: true, required: true },
  { name: 'severity', label: 'Severity', type: 'select', required: true, options: [
    { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
  ] },
  { name: 'brought_by', label: 'Brought By' },
]

const STATUS_OPTIONS = ['waiting', 'in_treatment', 'admitted', 'discharged']

export default function Emergency() {
  const { role } = useAuth()
  const showToast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const canRegister = ['receptionist', 'doctor', 'hospital_admin', 'super_admin'].includes(role)
  const canManage = ['doctor', 'hospital_admin', 'super_admin'].includes(role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/emergency', { params: { page: 1, per_page: 20 } })
      setRows(res.data.data)
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load])

  async function register(values) {
    try {
      await api.post('/emergency', values)
      showToast('Emergency patient registered')
      setOpen(false)
      load()
      return { success: true }
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
      return { errors: error?.response?.data?.errors }
    }
  }

  async function changeStatus(row, newStatus) {
    try {
      await api.patch(`/emergency/${row.id}/status`, { status: newStatus })
      showToast('Status updated')
      load()
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Emergency Patients"
        description="Walk-in emergency cases, sorted by severity."
        actions={canRegister && <Button variant="danger" onClick={() => setOpen(true)}><Siren size={16} /> Register Emergency</Button>}
      />

      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <DataTable
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'full_name', label: 'Name' },
            { key: 'age', label: 'Age' },
            { key: 'severity', label: 'Severity', render: (r) => <Badge value={r.severity} /> },
            { key: 'condition_note', label: 'Condition' },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
            { key: 'brought_in_at', label: 'Brought In' },
          ]}
          rows={rows}
          loading={loading}
          actions={canManage ? (row) => (
            <Select value={row.status} onChange={(e) => changeStatus(row, e.target.value)} className="!py-1 text-xs">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </Select>
          ) : null}
        />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Register Emergency Patient">
        <ResourceForm fields={FIELDS} onSubmit={register} onCancel={() => setOpen(false)} submitLabel="Register" />
      </Modal>
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { Plus, LogOut } from 'lucide-react'
import { api, apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ResourceForm from '../../components/ui/ResourceForm'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

const TABS = [
  { key: 'admissions', label: 'Admissions' },
  { key: 'beds', label: 'Beds' },
]

const ADMIT_FIELDS = [
  {
    name: 'patient_id', label: 'Patient', required: true, type: 'lookup', endpoint: '/patients',
    getLabel: (p) => `${p.first_name} ${p.last_name}`, getSubLabel: (p) => p.phone,
  },
  {
    name: 'bed_id', label: 'Bed', required: true, type: 'lookup', endpoint: '/admissions/beds',
    searchable: false, extraParams: { status: 'available' },
    getLabel: (b) => `${b.ward_name} — Bed ${b.bed_number}`, getSubLabel: () => 'Available',
    hint: 'Only available beds are shown.',
  },
  {
    name: 'doctor_id', label: 'Doctor', type: 'lookup', endpoint: '/doctors',
    getLabel: (d) => `Dr. ${d.first_name} ${d.last_name}`, getSubLabel: (d) => d.specialty,
  },
  { name: 'reason', label: 'Reason for Admission', type: 'textarea', fullWidth: true },
]

const BED_FIELDS = [
  { name: 'ward_name', label: 'Ward Name', required: true },
  { name: 'bed_number', label: 'Bed Number', required: true },
]

export default function Admissions() {
  const [tab, setTab] = useState('admissions')
  return (
    <div>
      <PageHeader title="Admissions & Bed Management" description="Track bed availability and patient admissions." />
      <div className="mb-5 flex gap-1 rounded-lg border border-slate-100 bg-white p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-primary-500 text-white' : 'text-slate hover:bg-canvas'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'admissions' ? <AdmissionsTab /> : <BedsTab />}
    </div>
  )
}

function AdmissionsTab() {
  const { role } = useAuth()
  const showToast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const canAdmit = ['doctor', 'receptionist', 'hospital_admin', 'super_admin'].includes(role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admissions', { params: { page: 1, per_page: 20 } })
      setRows(res.data.data)
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load])

  async function admit(values) {
    try {
      await api.post('/admissions', values)
      showToast('Patient admitted')
      setOpen(false)
      load()
      return { success: true }
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
      return { errors: error?.response?.data?.errors }
    }
  }

  async function discharge(row) {
    if (!confirm('Discharge this patient and free up their bed?')) return
    try {
      await api.patch(`/admissions/${row.id}/discharge`)
      showToast('Patient discharged')
      load()
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    }
  }

  return (
    <div>
      {canAdmit && (
        <div className="mb-3 flex justify-end">
          <Button onClick={() => setOpen(true)}><Plus size={16} /> Admit Patient</Button>
        </div>
      )}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <DataTable
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'patient_id', label: 'Patient ID' },
            { key: 'bed_id', label: 'Bed ID' },
            { key: 'doctor_id', label: 'Doctor ID' },
            { key: 'reason', label: 'Reason' },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
            { key: 'admitted_at', label: 'Admitted' },
          ]}
          rows={rows}
          loading={loading}
          actions={(row) => row.status === 'admitted' && (
            <button onClick={() => discharge(row)} className="flex items-center gap-1 text-xs font-medium text-primary-500 hover:underline">
              <LogOut size={13} /> Discharge
            </button>
          )}
        />
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Admit Patient">
        <ResourceForm fields={ADMIT_FIELDS} onSubmit={admit} onCancel={() => setOpen(false)} submitLabel="Admit" />
      </Modal>
    </div>
  )
}

function BedsTab() {
  const { role } = useAuth()
  const showToast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const canManage = ['hospital_admin', 'super_admin'].includes(role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admissions/beds')
      setRows(res.data.data)
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load])

  async function create(values) {
    try {
      await api.post('/admissions/beds', values)
      showToast('Bed added')
      setOpen(false)
      load()
      return { success: true }
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
      return { errors: error?.response?.data?.errors }
    }
  }

  return (
    <div>
      {canManage && (
        <div className="mb-3 flex justify-end">
          <Button onClick={() => setOpen(true)}><Plus size={16} /> Add Bed</Button>
        </div>
      )}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <DataTable
          columns={[
            { key: 'ward_name', label: 'Ward' },
            { key: 'bed_number', label: 'Bed #' },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
          ]}
          rows={rows}
          loading={loading}
        />
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Bed">
        <ResourceForm fields={BED_FIELDS} onSubmit={create} onCancel={() => setOpen(false)} />
      </Modal>
    </div>
  )
}

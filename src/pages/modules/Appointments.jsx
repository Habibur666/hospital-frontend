import { useEffect, useState, useCallback } from 'react'
import { Plus, Check, X, RotateCcw, Ban } from 'lucide-react'
import { api, apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import ResourceForm from '../../components/ui/ResourceForm'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Select } from '../../components/ui/Input'

function buildBookFields(role, myPatient) {
  const patientField =
    role === 'patient'
      ? {
          name: 'patient_id', label: 'Patient', type: 'static',
          displayValue: myPatient ? `${myPatient.first_name} ${myPatient.last_name} (you)` : 'Loading your profile…',
        }
      : {
          name: 'patient_id', label: 'Patient', required: true, type: 'lookup', endpoint: '/patients',
          getLabel: (p) => `${p.first_name} ${p.last_name}`, getSubLabel: (p) => p.phone,
        }

  return [
    patientField,
    {
      name: 'doctor_id', label: 'Doctor', required: true, type: 'lookup', endpoint: '/doctors',
      getLabel: (d) => `Dr. ${d.first_name} ${d.last_name}`, getSubLabel: (d) => d.specialty,
    },
    { name: 'appointment_date', label: 'Date', type: 'date', required: true },
    { name: 'appointment_time', label: 'Time', type: 'time', required: true },
    { name: 'reason', label: 'Reason for visit', type: 'textarea', fullWidth: true },
  ]
}

const RESCHEDULE_FIELDS = [
  { name: 'appointment_date', label: 'New Date', type: 'date', required: true },
  { name: 'appointment_time', label: 'New Time', type: 'time', required: true },
]

const STAFF_ROLES = ['receptionist', 'hospital_admin', 'super_admin']

export default function Appointments() {
  const { role } = useAuth()
  const showToast = useToast()
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [bookOpen, setBookOpen] = useState(false)
  const [reschedTarget, setReschedTarget] = useState(null)

  const canBook = ['receptionist', 'patient', 'hospital_admin', 'super_admin'].includes(role)
  const isStaff = STAFF_ROLES.includes(role)

  // Used both to auto-fill "book for myself" and to know which rows are
  // "mine" so action buttons (cancel/reschedule) only show where they'd
  // actually be allowed by the backend's ownership checks.
  const [myPatient, setMyPatient] = useState(null)
  const [myDoctor, setMyDoctor] = useState(null)
  useEffect(() => {
    if (role === 'patient') {
      api.get('/patients/me').then((r) => setMyPatient(r.data.data)).catch(() => setMyPatient(undefined))
    }
    if (role === 'doctor') {
      api.get('/doctors/me').then((r) => setMyDoctor(r.data.data)).catch(() => setMyDoctor(undefined))
    }
  }, [role])

  function isOwnAppointment(row) {
    if (role === 'patient') return myPatient && row.patient_id === myPatient.id
    if (role === 'doctor') return myDoctor && row.doctor_id === myDoctor.id
    return true
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 10 }
      if (status) params.status = status
      const res = await api.get('/appointments', { params })
      setRows(res.data.data)
      setMeta(res.data.meta)
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status])

  useEffect(() => { load() }, [load])

  async function book(values) {
    try {
      await api.post('/appointments', values)
      showToast('Appointment booked')
      setBookOpen(false)
      load()
      return { success: true }
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
      return { errors: error?.response?.data?.errors }
    }
  }

  async function doAction(id, action) {
    try {
      await api.patch(`/appointments/${id}/${action}`)
      showToast(`Appointment ${action}d`)
      load()
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    }
  }

  async function reschedule(values) {
    try {
      await api.patch(`/appointments/${reschedTarget.id}/reschedule`, values)
      showToast('Appointment rescheduled')
      setReschedTarget(null)
      load()
      return { success: true }
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
      return { errors: error?.response?.data?.errors }
    }
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'patient', label: 'Patient', render: (r) => `${r.patient_first_name} ${r.patient_last_name}` },
    { key: 'doctor_id', label: 'Doctor ID' },
    { key: 'appointment_date', label: 'Date' },
    { key: 'appointment_time', label: 'Time' },
    { key: 'queue_number', label: 'Queue #' },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Book, approve, reschedule and manage patient appointments."
        actions={
          canBook && (
            <Button onClick={() => setBookOpen(true)}>
              <Plus size={16} /> Book Appointment
            </Button>
          )
        }
      />

      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-4">
          <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }} className="max-w-[180px]">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="completed">Completed</option>
          </Select>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          actions={(row) => {
            const own = isOwnAppointment(row)
            const canApproveThis = ['doctor'].includes(role) ? own : isStaff
            const canCancelThis = isStaff || (['doctor', 'patient'].includes(role) && own)
            const canRescheduleThis = isStaff || (role === 'patient' && own)

            return (
              <div className="flex items-center justify-end gap-1">
                {canApproveThis && row.status === 'pending' && (
                  <>
                    <button onClick={() => doAction(row.id, 'approve')} className="rounded-md p-1.5 text-slate hover:bg-canvas hover:text-success-500" title="Approve">
                      <Check size={15} />
                    </button>
                    <button onClick={() => doAction(row.id, 'reject')} className="rounded-md p-1.5 text-slate hover:bg-canvas hover:text-danger-500" title="Reject">
                      <X size={15} />
                    </button>
                  </>
                )}
                {canRescheduleThis && !['cancelled', 'completed'].includes(row.status) && (
                  <button onClick={() => setReschedTarget(row)} className="rounded-md p-1.5 text-slate hover:bg-canvas hover:text-primary-500" title="Reschedule">
                    <RotateCcw size={15} />
                  </button>
                )}
                {canCancelThis && !['cancelled', 'completed'].includes(row.status) && (
                  <button onClick={() => doAction(row.id, 'cancel')} className="rounded-md p-1.5 text-slate hover:bg-canvas hover:text-danger-500" title="Cancel">
                    <Ban size={15} />
                  </button>
                )}
              </div>
            )
          }}
        />
        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      <Modal open={bookOpen} onClose={() => setBookOpen(false)} title="Book Appointment">
        {role === 'patient' && myPatient === undefined ? (
          <div className="rounded-lg bg-warning-50 px-3 py-3 text-sm text-warning-500">
            We couldn't find a patient profile linked to your account yet. Please contact reception for help.
          </div>
        ) : (
          <ResourceForm
            fields={buildBookFields(role, myPatient)}
            initialValues={role === 'patient' && myPatient ? { patient_id: myPatient.id } : {}}
            onSubmit={book}
            onCancel={() => setBookOpen(false)}
            submitLabel="Book"
          />
        )}
      </Modal>

      <Modal open={!!reschedTarget} onClose={() => setReschedTarget(null)} title={`Reschedule Appointment #${reschedTarget?.id ?? ''}`}>
        <ResourceForm fields={RESCHEDULE_FIELDS} onSubmit={reschedule} onCancel={() => setReschedTarget(null)} submitLabel="Reschedule" />
      </Modal>
    </div>
  )
}

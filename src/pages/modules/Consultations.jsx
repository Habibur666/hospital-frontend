import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api, apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ResourceForm from '../../components/ui/ResourceForm'
import Button from '../../components/ui/Button'
import EntityPicker from '../../components/ui/EntityPicker'

const FIELDS = [
  { name: 'appointment_id', label: 'Appointment ID', required: true },
  {
    name: 'patient_id', label: 'Patient', required: true, type: 'lookup', endpoint: '/patients',
    getLabel: (p) => `${p.first_name} ${p.last_name}`, getSubLabel: (p) => p.phone,
  },
  { name: 'symptoms', label: 'Symptoms', type: 'textarea', fullWidth: true },
  { name: 'diagnosis', label: 'Diagnosis', type: 'textarea', fullWidth: true },
  { name: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
]

export default function Consultations() {
  const { role } = useAuth()
  const showToast = useToast()
  const isPatient = role === 'patient'

  const [myPatient, setMyPatient] = useState(null) // null = loading, undefined = no profile yet
  const [patientId, setPatientId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const canCreate = role === 'doctor'

  // Patients can't browse the full patient list (privacy), so instead we
  // look up their own patient_id once and load their own notes automatically.
  useEffect(() => {
    if (!isPatient) return
    api.get('/patients/me')
      .then((r) => {
        setMyPatient(r.data.data)
        setPatientId(String(r.data.data.id))
      })
      .catch(() => setMyPatient(undefined))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPatient])

  useEffect(() => {
    if (isPatient && patientId) search()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPatient, patientId])

  async function search(e, idOverride) {
    e?.preventDefault()
    const idToUse = idOverride || patientId
    if (!idToUse) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await api.get(`/consultations/patient/${idToUse}`)
      setRows(res.data.data)
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function create(values) {
    try {
      await api.post('/consultations', values)
      showToast('Consultation note saved')
      setCreateOpen(false)
      // Switch the visible list to whichever patient this note was just
      // created for, so the doctor immediately sees what they just wrote
      // — instead of silently refreshing whatever patient was previously
      // searched (which might be a different patient, or nobody).
      setPatientId(String(values.patient_id))
      search(null, values.patient_id)
      return { success: true }
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
      return { errors: error?.response?.data?.errors }
    }
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'appointment_id', label: 'Appt ID' },
    { key: 'doctor_id', label: 'Doctor ID' },
    { key: 'symptoms', label: 'Symptoms' },
    { key: 'diagnosis', label: 'Diagnosis' },
    { key: 'notes', label: 'Notes' },
    { key: 'created_at', label: 'Date' },
  ]

  return (
    <div>
      <PageHeader
        title="Consultation Notes"
        description={isPatient ? 'Your consultation history.' : "Doctor's notes per patient visit — symptoms, diagnosis, and follow-up notes."}
        actions={canCreate && <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> New Note</Button>}
      />

      {isPatient && myPatient === undefined && (
        <div className="mb-4 rounded-lg bg-warning-50 px-3 py-3 text-sm text-warning-500">
          We couldn't find a patient profile linked to your account yet. Please contact reception for help.
        </div>
      )}

      {!isPatient && (
        <form onSubmit={search} className="mb-4 flex gap-2">
          <div className="w-full max-w-xs">
            <EntityPicker
              endpoint="/patients" value={patientId} onChange={setPatientId}
              getLabel={(p) => `${p.first_name} ${p.last_name}`} getSubLabel={(p) => p.phone}
              placeholder="Search patient…"
            />
          </div>
          <Button type="submit" variant="secondary">View History</Button>
        </form>
      )}

      {(!isPatient || myPatient) && (
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
          <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            emptyText={searched ? 'No consultation notes found' : 'Pick a patient above to view their consultation history'}
          />
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Consultation Note">
        <ResourceForm fields={FIELDS} initialValues={{ patient_id: patientId }} onSubmit={create} onCancel={() => setCreateOpen(false)} />
      </Modal>
    </div>
  )
}

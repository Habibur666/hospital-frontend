import { useEffect, useState } from 'react'
import { Upload, FileText, Trash2, ExternalLink } from 'lucide-react'
import { api, apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import EntityPicker from '../../components/ui/EntityPicker'
import { Field, Input } from '../../components/ui/Input'

export default function MedicalRecords() {
  const { role } = useAuth()
  const showToast = useToast()
  const isPatient = role === 'patient'

  const [myPatient, setMyPatient] = useState(null) // null = loading, undefined = no profile yet
  const [patientId, setPatientId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  const canUpload = ['doctor', 'receptionist', 'hospital_admin', 'super_admin', 'lab_technician', 'patient'].includes(role)
  const canDelete = ['hospital_admin', 'super_admin'].includes(role)

  // Patients can't browse the full patient list (privacy), so instead we
  // look up their own patient_id once and load their own files automatically.
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

  async function search(e) {
    e?.preventDefault()
    if (!patientId) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await api.get(`/medical-records/patient/${patientId}`)
      setRows(res.data.data)
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function deleteRecord(row) {
    if (!confirm('Delete this file? This cannot be undone.')) return
    try {
      await api.delete(`/medical-records/${row.id}`)
      showToast('Record deleted')
      search()
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    }
  }

  const columns = [
    { key: 'title', label: 'Title', render: (r) => (
      <span className="flex items-center gap-2"><FileText size={14} className="text-slate-400" /> {r.title}</span>
    ) },
    { key: 'file_type', label: 'Type' },
    { key: 'created_at', label: 'Uploaded' },
    { key: 'link', label: '', render: (r) => (
      <a href={r.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary-500 hover:underline">
        View <ExternalLink size={12} />
      </a>
    ) },
  ]

  return (
    <div>
      <PageHeader
        title="Medical Records"
        description={isPatient ? 'Your reports and documents.' : 'Patient reports and documents (PDF, PNG, JPG — up to 0.5MB each).'}
        actions={canUpload && (myPatient !== undefined) && <Button onClick={() => setUploadOpen(true)}><Upload size={16} /> Upload File</Button>}
      />

      {isPatient && myPatient === undefined && (
        <div className="mb-4 rounded-lg bg-warning-50 px-3 py-3 text-sm text-warning-500">
          We couldn't find a patient profile linked to your account yet. Please register your
          patient profile first before viewing or uploading files.
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
          <Button type="submit" variant="secondary">View Files</Button>
        </form>
      )}

      {(!isPatient || myPatient) && (
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
          <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            emptyText={searched ? 'No files found' : 'Pick a patient above to view their files'}
            actions={canDelete ? (row) => (
              <button onClick={() => deleteRecord(row)} className="rounded-md p-1.5 text-slate hover:bg-canvas hover:text-danger-500" title="Delete">
                <Trash2 size={15} />
              </button>
            ) : null}
          />
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        lockedPatient={isPatient ? myPatient : null}
        defaultPatientId={patientId}
        onUploaded={() => { setUploadOpen(false); if (searched) search() }}
      />
    </div>
  )
}

function UploadModal({ open, onClose, lockedPatient, defaultPatientId, onUploaded }) {
  const showToast = useToast()
  const [patientId, setPatientId] = useState(defaultPatientId || '')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (lockedPatient) setPatientId(String(lockedPatient.id))
  }, [lockedPatient])

  async function submit(e) {
    e.preventDefault()
    if (!patientId) {
      showToast('Please select a patient from the dropdown.', 'error')
      return
    }
    if (!file) {
      showToast('Please choose a file', 'error')
      return
    }
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('patient_id', patientId)
      if (title) formData.append('title', title)
      await api.post('/medical-records', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      showToast('File uploaded')
      setFile(null)
      setTitle('')
      onUploaded()
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Upload Medical Record">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Patient" required>
          {lockedPatient ? (
            <div className="rounded-lg border border-slate-100 bg-canvas px-3 py-2 text-sm text-ink">
              {lockedPatient.first_name} {lockedPatient.last_name} (you)
            </div>
          ) : (
            <EntityPicker
              endpoint="/patients" value={patientId} onChange={setPatientId}
              getLabel={(p) => `${p.first_name} ${p.last_name}`} getSubLabel={(p) => p.phone} required
            />
          )}
        </Field>
        <Field label="Title" hint="Defaults to the file name if left blank"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Blood Test Report" /></Field>
        <Field label="File" required hint="PDF, PNG or JPG, up to 0.5MB">
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-600 hover:file:bg-primary-100"
            required
          />
        </Field>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Uploading…' : 'Upload'}</Button>
        </div>
      </form>
    </Modal>
  )
}

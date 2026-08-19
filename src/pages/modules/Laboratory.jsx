import { useEffect, useState, useCallback } from 'react'
import { Plus, Upload, ExternalLink } from 'lucide-react'
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
import { Select, Field } from '../../components/ui/Input'

const REQUEST_FIELDS = [
  {
    name: 'patient_id', label: 'Patient', required: true, type: 'lookup', endpoint: '/patients',
    getLabel: (p) => `${p.first_name} ${p.last_name}`, getSubLabel: (p) => p.phone,
  },
  {
    name: 'doctor_id', label: 'Doctor', type: 'lookup', endpoint: '/doctors',
    getLabel: (d) => `Dr. ${d.first_name} ${d.last_name}`, getSubLabel: (d) => d.specialty,
  },
  { name: 'test_name', label: 'Test Name', required: true, placeholder: 'e.g. Complete Blood Count' },
]

const STATUS_OPTIONS = ['requested', 'in_progress', 'completed', 'cancelled']

export default function Laboratory() {
  const { role } = useAuth()
  const showToast = useToast()
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [requestOpen, setRequestOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState(null)

  const canRequest = ['doctor', 'receptionist', 'hospital_admin', 'super_admin'].includes(role)
  const canManage = ['lab_technician', 'hospital_admin', 'super_admin'].includes(role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 10 }
      if (status) params.status = status
      const res = await api.get('/laboratory', { params })
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

  async function requestTest(values) {
    try {
      await api.post('/laboratory', values)
      showToast('Lab test requested')
      setRequestOpen(false)
      load()
      return { success: true }
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
      return { errors: error?.response?.data?.errors }
    }
  }

  async function changeStatus(row, newStatus) {
    try {
      await api.patch(`/laboratory/${row.id}/status`, { status: newStatus })
      showToast('Status updated')
      load()
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    }
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'patient_id', label: 'Patient ID' },
    { key: 'test_name', label: 'Test' },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    { key: 'requested_at', label: 'Requested' },
    { key: 'report_url', label: 'Report', render: (r) => r.report_url ? (
      <a href={r.report_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary-500 hover:underline">
        View <ExternalLink size={12} />
      </a>
    ) : '—' },
  ]

  return (
    <div>
      <PageHeader
        title="Laboratory"
        description="Test requests, status tracking, and report uploads."
        actions={canRequest && <Button onClick={() => setRequestOpen(true)}><Plus size={16} /> Request Test</Button>}
      />

      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-4">
          <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }} className="max-w-[180px]">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </Select>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          actions={canManage ? (row) => (
            <div className="flex items-center justify-end gap-2">
              <Select
                value={row.status}
                onChange={(e) => changeStatus(row, e.target.value)}
                className="!py-1 text-xs"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </Select>
              <button onClick={() => setReportTarget(row)} className="rounded-md p-1.5 text-slate hover:bg-canvas hover:text-primary-500" title="Upload report">
                <Upload size={15} />
              </button>
            </div>
          ) : null}
        />
        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Request Lab Test">
        <ResourceForm fields={REQUEST_FIELDS} onSubmit={requestTest} onCancel={() => setRequestOpen(false)} submitLabel="Request" />
      </Modal>

      <ReportUploadModal target={reportTarget} onClose={() => setReportTarget(null)} onUploaded={() => { setReportTarget(null); load() }} />
    </div>
  )
}

function ReportUploadModal({ target, onClose, onUploaded }) {
  const showToast = useToast()
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!file) return showToast('Please choose a file', 'error')
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await api.post(`/laboratory/${target.id}/report`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      showToast('Report uploaded')
      setFile(null)
      onUploaded()
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={!!target} onClose={onClose} title={`Upload Report — Test #${target?.id ?? ''}`}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Report File" required hint="PDF, PNG or JPG, up to 0.5MB">
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

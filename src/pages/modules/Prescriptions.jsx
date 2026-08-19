import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api, apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import EntityPicker from '../../components/ui/EntityPicker'
import { Field, Input, Textarea } from '../../components/ui/Input'
import { Loader2, Inbox } from 'lucide-react'

const EMPTY_ITEM = { medicine_name: '', dosage: '', frequency: '', duration: '' }

export default function Prescriptions() {
  const { role } = useAuth()
  const showToast = useToast()
  const [patientId, setPatientId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const canCreate = role === 'doctor'

  async function search(e) {
    e?.preventDefault()
    if (!patientId) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await api.get(`/prescriptions/patient/${patientId}`)
      setRows(res.data.data)
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Prescriptions"
        description="Doctor-issued prescriptions with one or more medicine items."
        actions={canCreate && <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> New Prescription</Button>}
      />

      <form onSubmit={search} className="mb-4 flex gap-2">
        <div className="w-full max-w-xs">
          <EntityPicker
            endpoint="/patients" value={patientId} onChange={setPatientId}
            getLabel={(p) => `${p.first_name} ${p.last_name}`} getSubLabel={(p) => p.phone}
            placeholder="Search patient…"
          />
        </div>
        <Button type="submit" variant="secondary">View Prescriptions</Button>
      </form>

      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white py-16 text-slate shadow-sm">
            <Loader2 className="animate-spin" size={18} /> Loading…
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white py-16 text-slate shadow-sm">
            <Inbox size={28} className="text-slate-300" />
            <p className="text-sm">{searched ? 'No prescriptions for this patient' : 'Pick a patient above to view prescriptions'}</p>
          </div>
        )}
        {rows.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display font-semibold text-ink">Prescription #{p.id}</p>
              <p className="text-xs text-slate">{p.created_at}</p>
            </div>
            {p.notes && <p className="mb-3 text-sm text-slate">{p.notes}</p>}
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-400">
                  <th className="py-1 pr-4">Medicine</th>
                  <th className="py-1 pr-4">Dosage</th>
                  <th className="py-1 pr-4">Frequency</th>
                  <th className="py-1">Duration</th>
                </tr>
              </thead>
              <tbody>
                {p.items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-50">
                    <td className="py-1.5 pr-4">{item.medicine_name}</td>
                    <td className="py-1.5 pr-4">{item.dosage || '—'}</td>
                    <td className="py-1.5 pr-4">{item.frequency || '—'}</td>
                    <td className="py-1.5">{item.duration || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <CreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultPatientId={patientId}
        onCreated={() => { setCreateOpen(false); if (searched) search() }}
      />
    </div>
  )
}

function CreateModal({ open, onClose, defaultPatientId, onCreated }) {
  const showToast = useToast()
  const [patientId, setPatientId] = useState(defaultPatientId || '')
  const [appointmentId, setAppointmentId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [saving, setSaving] = useState(false)

  function updateItem(idx, field, value) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)))
  }

  async function submit(e) {
    e.preventDefault()
    if (!patientId) {
      showToast('Please select a patient from the dropdown.', 'error')
      return
    }
    setSaving(true)
    try {
      await api.post('/prescriptions', {
        patient_id: patientId,
        appointment_id: appointmentId || undefined,
        notes,
        items: items.filter((it) => it.medicine_name),
      })
      showToast('Prescription created')
      setItems([{ ...EMPTY_ITEM }])
      onCreated()
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Prescription" width="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Patient" required>
            <EntityPicker
              endpoint="/patients" value={patientId} onChange={setPatientId}
              getLabel={(p) => `${p.first_name} ${p.last_name}`} getSubLabel={(p) => p.phone} required
            />
          </Field>
          <Field label="Appointment ID"><Input value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} /></Field>
        </div>
        <Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Medicines</p>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-100 p-3 sm:grid-cols-5">
                <Input placeholder="Medicine name" className="sm:col-span-2" value={item.medicine_name} onChange={(e) => updateItem(idx, 'medicine_name', e.target.value)} />
                <Input placeholder="Dosage" value={item.dosage} onChange={(e) => updateItem(idx, 'dosage', e.target.value)} />
                <Input placeholder="Frequency" value={item.frequency} onChange={(e) => updateItem(idx, 'frequency', e.target.value)} />
                <div className="flex gap-1">
                  <Input placeholder="Duration" value={item.duration} onChange={(e) => updateItem(idx, 'duration', e.target.value)} />
                  <button type="button" onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))} className="rounded-md p-2 text-slate hover:bg-canvas hover:text-danger-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])} className="mt-2 text-sm font-medium text-primary-500 hover:underline">
            + Add another medicine
          </button>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create Prescription'}</Button>
        </div>
      </form>
    </Modal>
  )
}

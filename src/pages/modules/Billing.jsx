import { useEffect, useState, useCallback } from 'react'
import { Plus, CreditCard, Download, Trash2 } from 'lucide-react'
import { api, apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Field, Input, Select } from '../../components/ui/Input'
import EntityPicker from '../../components/ui/EntityPicker'

const PAYMENT_METHODS = ['cash', 'card', 'insurance', 'online']

export default function Billing() {
  const { role } = useAuth()
  const showToast = useToast()
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)

  const canCreate = ['cashier', 'receptionist', 'hospital_admin', 'super_admin'].includes(role)
  const canPay = ['cashier', 'hospital_admin', 'super_admin'].includes(role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/billing/invoices', { params: { page, per_page: 10 } })
      setRows(res.data.data)
      setMeta(res.data.meta)
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  useEffect(() => { load() }, [load])

  async function pay(row) {
    try {
      await api.patch(`/billing/invoices/${row.id}/pay`)
      showToast('Invoice marked as paid')
      load()
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    }
  }

  async function downloadPdf(row) {
    try {
      const res = await api.get(`/billing/invoices/${row.id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice-${row.id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    }
  }

  const columns = [
    { key: 'id', label: 'Invoice #' },
    { key: 'patient_id', label: 'Patient ID' },
    { key: 'total_amount', label: 'Total', render: (r) => `$${r.total_amount}` },
    { key: 'payment_method', label: 'Method' },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    { key: 'created_at', label: 'Date' },
  ]

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Invoices, tax, discounts, payment methods, and PDF invoices."
        actions={canCreate && <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> New Invoice</Button>}
      />

      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              {canPay && row.status !== 'paid' && (
                <button onClick={() => pay(row)} className="rounded-md p-1.5 text-slate hover:bg-canvas hover:text-success-500" title="Mark as paid">
                  <CreditCard size={15} />
                </button>
              )}
              <button onClick={() => downloadPdf(row)} className="rounded-md p-1.5 text-slate hover:bg-canvas hover:text-primary-500" title="Download PDF">
                <Download size={15} />
              </button>
            </div>
          )}
        />
        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      <CreateInvoiceModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); load() }} />
    </div>
  )
}

const EMPTY_ITEM = { description: '', quantity: 1, unit_price: '' }

function CreateInvoiceModal({ open, onClose, onCreated }) {
  const showToast = useToast()
  const [patientId, setPatientId] = useState('')
  const [taxAmount, setTaxAmount] = useState('0')
  const [discountAmount, setDiscountAmount] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [saving, setSaving] = useState(false)

  function updateItem(idx, field, value) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)))
  }

  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0)
  const total = subtotal + (Number(taxAmount) || 0) - (Number(discountAmount) || 0)

  async function submit(e) {
    e.preventDefault()
    if (!patientId) {
      showToast('Please select a patient from the dropdown.', 'error')
      return
    }
    setSaving(true)
    try {
      await api.post('/billing/invoices', {
        patient_id: patientId,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        payment_method: paymentMethod,
        items: items.filter((it) => it.description),
      })
      showToast('Invoice created')
      onCreated()
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Invoice" width="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Patient" required>
            <EntityPicker
              endpoint="/patients" value={patientId} onChange={setPatientId}
              getLabel={(p) => `${p.first_name} ${p.last_name}`} getSubLabel={(p) => p.phone} required
            />
          </Field>
          <Field label="Tax Amount"><Input type="number" step="0.01" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} /></Field>
          <Field label="Discount Amount"><Input type="number" step="0.01" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} /></Field>
        </div>
        <Field label="Payment Method">
          <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </Field>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Line Items</p>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-100 p-3 sm:grid-cols-4">
                <Input placeholder="Description" className="sm:col-span-2" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} />
                <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                <div className="flex gap-1">
                  <Input type="number" step="0.01" placeholder="Unit price" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', e.target.value)} />
                  <button type="button" onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))} className="rounded-md p-2 text-slate hover:bg-canvas hover:text-danger-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])} className="mt-2 text-sm font-medium text-primary-500 hover:underline">
            + Add line item
          </button>
        </div>

        <div className="rounded-lg bg-canvas p-3 text-sm">
          <div className="flex justify-between text-slate"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between font-semibold text-ink"><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Invoice'}</Button>
        </div>
      </form>
    </Modal>
  )
}

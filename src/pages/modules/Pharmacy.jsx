import { useEffect, useState } from 'react'
import { Plus, AlertTriangle, Clock, ShoppingCart } from 'lucide-react'
import { api, apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import CrudPage from '../../components/ui/CrudPage'
import Modal from '../../components/ui/Modal'
import ResourceForm from '../../components/ui/ResourceForm'
import Button from '../../components/ui/Button'
import StatCard from '../../components/ui/StatCard'

const MEDICINE_FIELDS = [
  { name: 'name', label: 'Medicine Name', required: true },
  { name: 'category', label: 'Category' },
  { name: 'unit_price', label: 'Unit Price', type: 'number', step: '0.01' },
  { name: 'stock_qty', label: 'Stock Quantity', type: 'number' },
  { name: 'low_stock_threshold', label: 'Low Stock Threshold', type: 'number' },
  { name: 'expiry_date', label: 'Expiry Date', type: 'date' },
]

const SALE_FIELDS = [
  {
    name: 'medicine_id', label: 'Medicine', required: true, type: 'lookup', endpoint: '/pharmacy/medicines',
    getLabel: (m) => m.name, getSubLabel: (m) => `Stock: ${m.stock_qty} · $${m.unit_price}`,
  },
  {
    name: 'patient_id', label: 'Patient', type: 'lookup', endpoint: '/patients',
    getLabel: (p) => `${p.first_name} ${p.last_name}`, getSubLabel: (p) => p.phone,
  },
  { name: 'quantity', label: 'Quantity', type: 'number', required: true },
]

export default function Pharmacy() {
  const { role } = useAuth()
  const showToast = useToast()
  const [lowStock, setLowStock] = useState(null)
  const [expiring, setExpiring] = useState(null)
  const [saleOpen, setSaleOpen] = useState(false)

  const canSell = ['pharmacist', 'cashier', 'hospital_admin', 'super_admin'].includes(role)
  const canViewAlerts = ['pharmacist', 'hospital_admin', 'super_admin'].includes(role)

  useEffect(() => {
    if (!canViewAlerts) return
    api.get('/pharmacy/medicines/low-stock').then((r) => setLowStock(r.data.data.length)).catch(() => {})
    api.get('/pharmacy/medicines/expiring-soon').then((r) => setExpiring(r.data.data.length)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAlerts])

  async function recordSale(values) {
    try {
      await api.post('/pharmacy/sales', values)
      showToast('Sale recorded')
      setSaleOpen(false)
      return { success: true }
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
      return { errors: error?.response?.data?.errors }
    }
  }

  const config = {
    title: 'Pharmacy',
    entityName: 'Medicine',
    description: 'Medicine stock, expiry tracking, and low-stock alerts.',
    endpoint: '/pharmacy/medicines',
    paginated: true,
    searchable: true,
    canCreate: ['pharmacist', 'hospital_admin', 'super_admin'],
    canEdit: ['pharmacist', 'hospital_admin', 'super_admin'],
    canDelete: [],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
      { key: 'unit_price', label: 'Unit Price', render: (r) => r.unit_price != null ? `$${r.unit_price}` : '—' },
      { key: 'stock_qty', label: 'Stock', render: (r) => (
        <span className={r.stock_qty <= r.low_stock_threshold ? 'font-semibold text-warning-500' : ''}>{r.stock_qty}</span>
      ) },
      { key: 'expiry_date', label: 'Expiry' },
    ],
    fields: MEDICINE_FIELDS,
  }

  return (
    <div>
      {canViewAlerts && (
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Low Stock Items" value={lowStock ?? '—'} icon={AlertTriangle} accent="warning" />
          <StatCard label="Expiring Within 30 Days" value={expiring ?? '—'} icon={Clock} accent="danger" />
        </div>
      )}

      <div className="mb-5 flex justify-end">
        {canSell && (
          <Button variant="secondary" onClick={() => setSaleOpen(true)}>
            <ShoppingCart size={16} /> Record Sale
          </Button>
        )}
      </div>

      <CrudPage config={config} />

      <Modal open={saleOpen} onClose={() => setSaleOpen(false)} title="Record Pharmacy Sale">
        <ResourceForm fields={SALE_FIELDS} onSubmit={recordSale} onCancel={() => setSaleOpen(false)} submitLabel="Record Sale" />
      </Modal>
    </div>
  )
}

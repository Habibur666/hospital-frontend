import { useEffect, useState, useCallback } from 'react'
import { Plus, PackageCheck } from 'lucide-react'
import { api, apiErrorMessage } from '../../api/client'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ResourceForm from '../../components/ui/ResourceForm'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

const TABS = [
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'purchase_orders', label: 'Purchase Orders' },
  { key: 'stock', label: 'Stock Movements' },
]

const SUPPLIER_FIELDS = [
  { name: 'name', label: 'Supplier Name', required: true },
  { name: 'phone', label: 'Phone' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'address', label: 'Address', type: 'textarea', fullWidth: true },
]

const ORDER_FIELDS = [
  {
    name: 'supplier_id', label: 'Supplier', required: true, type: 'lookup', endpoint: '/inventory/suppliers',
    searchable: false, getLabel: (s) => s.name, getSubLabel: (s) => s.phone,
  },
  { name: 'item_name', label: 'Item Name', required: true },
  { name: 'quantity', label: 'Quantity', type: 'number', required: true },
  { name: 'unit_price', label: 'Unit Price', type: 'number', step: '0.01', required: true },
]

const STOCK_FIELDS = [
  { name: 'item_name', label: 'Item Name', required: true },
  { name: 'quantity', label: 'Quantity', type: 'number', required: true },
  { name: 'reason', label: 'Reason', type: 'textarea', fullWidth: true },
]

export default function Inventory() {
  const [tab, setTab] = useState('suppliers')

  return (
    <div>
      <PageHeader title="Inventory" description="Suppliers, purchase orders, and stock movements." />

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

      {tab === 'suppliers' && <SuppliersTab />}
      {tab === 'purchase_orders' && <PurchaseOrdersTab />}
      {tab === 'stock' && <StockTab />}
    </div>
  )
}

function SuppliersTab() {
  const showToast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/inventory/suppliers')
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
      await api.post('/inventory/suppliers', values)
      showToast('Supplier added')
      setOpen(false)
      load()
      return { success: true }
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
      return { errors: error?.response?.data?.errors }
    }
  }

  async function remove(row) {
    if (!confirm('Delete this supplier?')) return
    try {
      await api.delete(`/inventory/suppliers/${row.id}`)
      showToast('Supplier deleted')
      load()
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    }
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus size={16} /> Add Supplier</Button>
      </div>
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'address', label: 'Address' },
          ]}
          rows={rows}
          loading={loading}
          actions={(row) => (
            <button onClick={() => remove(row)} className="text-xs font-medium text-danger-500 hover:underline">Delete</button>
          )}
        />
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Supplier">
        <ResourceForm fields={SUPPLIER_FIELDS} onSubmit={create} onCancel={() => setOpen(false)} />
      </Modal>
    </div>
  )
}

function PurchaseOrdersTab() {
  const showToast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/inventory/purchase-orders', { params: { page: 1, per_page: 20 } })
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
      await api.post('/inventory/purchase-orders', values)
      showToast('Purchase order created')
      setOpen(false)
      load()
      return { success: true }
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
      return { errors: error?.response?.data?.errors }
    }
  }

  async function receive(row) {
    try {
      await api.patch(`/inventory/purchase-orders/${row.id}/receive`)
      showToast('Purchase order received — stock updated')
      load()
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    }
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus size={16} /> New Purchase Order</Button>
      </div>
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <DataTable
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'supplier_name', label: 'Supplier' },
            { key: 'item_name', label: 'Item' },
            { key: 'quantity', label: 'Qty' },
            { key: 'unit_price', label: 'Unit Price' },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
          ]}
          rows={rows}
          loading={loading}
          actions={(row) => row.status !== 'received' && (
            <button onClick={() => receive(row)} className="flex items-center gap-1 text-xs font-medium text-success-500 hover:underline">
              <PackageCheck size={13} /> Receive
            </button>
          )}
        />
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="New Purchase Order">
        <ResourceForm fields={ORDER_FIELDS} onSubmit={create} onCancel={() => setOpen(false)} />
      </Modal>
    </div>
  )
}

function StockTab() {
  const showToast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState(null) // 'in' | 'out' | null

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/inventory/stock')
      setRows(res.data.data)
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load])

  async function submit(values) {
    try {
      await api.post(`/inventory/stock/${mode}`, values)
      showToast(`Stock ${mode === 'in' ? 'added' : 'removed'}`)
      setMode(null)
      load()
      return { success: true }
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
      return { errors: error?.response?.data?.errors }
    }
  }

  return (
    <div>
      <div className="mb-3 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setMode('out')}>Stock Out</Button>
        <Button onClick={() => setMode('in')}><Plus size={16} /> Stock In</Button>
      </div>
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <DataTable
          columns={[
            { key: 'item_name', label: 'Item' },
            { key: 'movement_type', label: 'Type', render: (r) => <Badge value={r.movement_type === 'in' ? 'available' : 'critical'} /> },
            { key: 'quantity', label: 'Qty' },
            { key: 'reason', label: 'Reason' },
            { key: 'created_at', label: 'Date' },
          ]}
          rows={rows}
          loading={loading}
        />
      </div>
      <Modal open={!!mode} onClose={() => setMode(null)} title={mode === 'in' ? 'Stock In' : 'Stock Out'}>
        <ResourceForm fields={STOCK_FIELDS} onSubmit={submit} onCancel={() => setMode(null)} />
      </Modal>
    </div>
  )
}

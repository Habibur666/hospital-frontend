import { useState } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'
import { api, apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Button from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'

const REPORT_TYPES = [
  { value: 'revenue', label: 'Revenue', roles: ['hospital_admin', 'super_admin', 'cashier'] },
  { value: 'appointments', label: 'Appointment Statistics', roles: ['hospital_admin', 'super_admin'] },
  { value: 'patients', label: 'Patient Statistics', roles: ['hospital_admin', 'super_admin'] },
  { value: 'pharmacy-sales', label: 'Pharmacy Sales', roles: ['hospital_admin', 'super_admin', 'pharmacist'] },
  { value: 'doctor-performance', label: 'Doctor Performance', roles: ['hospital_admin', 'super_admin'] },
]

export default function Reports() {
  const { role } = useAuth()
  const showToast = useToast()
  const availableReports = REPORT_TYPES.filter((r) => r.roles.includes(role))
  const [reportType, setReportType] = useState(availableReports[0]?.value || 'revenue')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  async function runReport(e) {
    e?.preventDefault()
    setLoading(true)
    try {
      const params = {}
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      const res = await api.get(`/reports/${reportType}`, { params })
      setData(res.data.data)
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Reports" description="Revenue, appointments, patients, pharmacy sales, and doctor performance." />

      <form onSubmit={runReport} className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <Field label="Report">
          <Select value={reportType} onChange={(e) => { setReportType(e.target.value); setData(null) }} className="min-w-[220px]">
            {availableReports.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
        </Field>
        <Field label="Start Date"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
        <Field label="End Date"><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
        <Button type="submit" disabled={loading}>
          <BarChart3 size={16} /> {loading ? 'Running…' : 'Run Report'}
        </Button>
      </form>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-slate">
          <Loader2 className="animate-spin" size={18} /> Running report…
        </div>
      )}

      {!loading && data && <ReportResult type={reportType} data={data} />}
    </div>
  )
}

function ReportResult({ type, data }) {
  if (type === 'revenue') {
    return (
      <div>
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Total Revenue" value={`$${Number(data.summary.total_revenue).toFixed(2)}`} accent="success" />
          <StatCard label="Paid Invoices" value={data.summary.invoice_count} accent="primary" />
        </div>
        <ReportTable columns={['day', 'revenue']} rows={data.daily_breakdown} />
      </div>
    )
  }
  if (type === 'appointments') {
    return <ReportTable columns={['status', 'total']} rows={data.by_status} />
  }
  if (type === 'patients') {
    return (
      <div>
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Total Patients" value={data.total_patients} accent="primary" />
          <StatCard label="New Patients (in range)" value={data.new_patients_in_range} accent="info" />
        </div>
        <ReportTable columns={['gender', 'total']} rows={data.by_gender} />
      </div>
    )
  }
  if (type === 'pharmacy-sales') {
    return (
      <div>
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Total Sales" value={`$${Number(data.summary.total_sales).toFixed(2)}`} accent="success" />
          <StatCard label="Number of Sales" value={data.summary.sale_count} accent="primary" />
        </div>
        <ReportTable columns={['name', 'total_quantity_sold', 'total_revenue']} rows={data.top_medicines} />
      </div>
    )
  }
  if (type === 'doctor-performance') {
    return <ReportTable columns={['first_name', 'last_name', 'total_appointments', 'completed_appointments']} rows={data} />
  }
  return null
}

function ReportTable({ columns, rows }) {
  if (!rows || rows.length === 0) {
    return <div className="rounded-xl border border-slate-100 bg-white p-8 text-center text-sm text-slate shadow-sm">No data for this range.</div>
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
            {columns.map((c) => <th key={c} className="px-4 py-3 font-medium">{c.replace(/_/g, ' ')}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b border-slate-50 last:border-0">
              {columns.map((c) => <td key={c} className="px-4 py-3 text-ink">{row[c] ?? '—'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

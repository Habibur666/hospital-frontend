import { useEffect, useState } from 'react'
import { CalendarCheck, Users, DollarSign, Clock } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api, apiErrorMessage } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import { Loader2 } from 'lucide-react'

export default function Dashboard() {
  const showToast = useToast()
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState(null)
  const [deptStats, setDeptStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, m, d] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/monthly-chart'),
          api.get('/dashboard/department-stats'),
        ])
        setSummary(s.data.data)
        setMonthly(m.data.data)
        setDeptStats(d.data.data)
      } catch (error) {
        showToast(apiErrorMessage(error), 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate">
        <Loader2 className="animate-spin" size={18} /> Loading dashboard…
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="Today's snapshot across the hospital." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Appointments" value={summary?.todays_appointments ?? 0} icon={CalendarCheck} accent="primary" />
        <StatCard label="Today's New Patients" value={summary?.todays_new_patients ?? 0} icon={Users} accent="info" />
        <StatCard label="Today's Revenue" value={`$${summary?.todays_revenue?.toFixed(2) ?? '0.00'}`} icon={DollarSign} accent="success" />
        <StatCard label="Pending Appointments" value={summary?.pending_appointments ?? 0} icon={Clock} accent="warning" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="mb-4 font-display font-semibold text-ink">Revenue — Last 6 Months</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly?.revenue_by_month || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F3" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5B6B7A' }} />
              <YAxis tick={{ fontSize: 12, fill: '#5B6B7A' }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#0C6B67" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="mb-4 font-display font-semibold text-ink">Appointments — Last 6 Months</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly?.appointments_by_month || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F3" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5B6B7A' }} />
              <YAxis tick={{ fontSize: 12, fill: '#5B6B7A' }} />
              <Tooltip />
              <Bar dataKey="total" fill="#E8863C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="mb-4 font-display font-semibold text-ink">Department Statistics</p>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
              <th className="py-2 pr-4 font-medium">Department</th>
              <th className="py-2 pr-4 font-medium">Doctors</th>
              <th className="py-2 font-medium">Appointments</th>
            </tr>
          </thead>
          <tbody>
            {(deptStats || []).map((d) => (
              <tr key={d.department} className="border-b border-slate-50 last:border-0">
                <td className="py-2.5 pr-4 text-ink">{d.department}</td>
                <td className="py-2.5 pr-4 text-slate">{d.doctor_count}</td>
                <td className="py-2.5 text-slate">{d.appointment_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

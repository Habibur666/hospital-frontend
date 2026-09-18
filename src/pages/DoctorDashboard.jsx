import { useEffect, useState } from 'react'
import { CalendarCheck, Clock, Users, Loader2 } from 'lucide-react'
import { api, apiErrorMessage } from '../api/client'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'

export default function DoctorDashboard() {
  const showToast = useToast()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/doctors/me/summary')
      .then((r) => setSummary(r.data.data))
      .catch((error) => showToast(apiErrorMessage(error), 'error'))
      .finally(() => setLoading(false))
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
      <PageHeader title="Dashboard" description="Your schedule at a glance." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Today's Appointments" value={summary?.todays_appointments ?? 0} icon={CalendarCheck} accent="primary" />
        <StatCard label="Pending Approval" value={summary?.pending_appointments ?? 0} icon={Clock} accent="warning" />
        <StatCard label="Patients Seen" value={summary?.total_patients_seen ?? 0} icon={Users} accent="success" />
      </div>

      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <p className="font-display font-semibold text-ink">Upcoming Appointments</p>
        </div>
        <DataTable
          columns={[
            { key: 'patient', label: 'Patient', render: (r) => `${r.patient_first_name} ${r.patient_last_name}` },
            { key: 'appointment_date', label: 'Date' },
            { key: 'appointment_time', label: 'Time' },
            { key: 'reason', label: 'Reason' },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
          ]}
          rows={summary?.upcoming_appointments || []}
          emptyText="No upcoming appointments"
        />
      </div>
    </div>
  )
}

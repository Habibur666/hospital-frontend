import { HeartPulse, ShieldCheck, Activity, Users } from 'lucide-react'

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-primary-500 p-10 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-400/40" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-primary-600/50" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
            <HeartPulse size={20} />
          </div>
          <span className="font-display text-lg font-bold">MediCore HMS</span>
        </div>

        <div className="relative">
          <h1 className="font-display text-3xl font-bold leading-tight">
            One system for the whole hospital.
          </h1>
          <p className="mt-3 max-w-sm text-primary-50/90">
            Patients, appointments, prescriptions, labs, pharmacy, billing and more — all in one
            place, built for every role on your team.
          </p>

          <div className="mt-8 space-y-4">
            <Feature icon={Users} text="Role-based access for every department" />
            <Feature icon={Activity} text="Live dashboard and reporting" />
            <Feature icon={ShieldCheck} text="Secure, auditable patient records" />
          </div>
        </div>

        <p className="relative text-xs text-primary-50/70">© {new Date().getFullYear()} MediCore HMS</p>
      </div>

      <div className="flex w-full flex-1 items-center justify-center p-6 lg:w-[55%]">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}

function Feature({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
        <Icon size={15} />
      </div>
      <span className="text-sm text-primary-50/90">{text}</span>
    </div>
  )
}

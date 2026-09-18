import {
  LayoutDashboard, Users, Building2, Stethoscope, HeartPulse, CalendarCheck,
  ClipboardList, Pill, FileText, FlaskConical, PillBottle, Boxes, Receipt,
  BedDouble, Siren, BarChart3, Bell, ShieldCheck,
} from 'lucide-react'

/**
 * Sidebar navigation, grouped, with the roles allowed to see each item.
 * `roles: null` means "any logged-in user can see this".
 *
 * IMPORTANT: these role lists are kept in sync with each backend module's
 * @role_required(...) decorator on its GET (list) endpoint. If you change
 * permissions on the backend, update the matching entry here too — otherwise
 * a role will either see a nav item that 403s, or not see one it's allowed
 * to use.
 */
export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'hospital_admin', 'doctor'] },
    ],
  },
  {
    label: 'Care',
    items: [
      { to: '/patients', label: 'Patients', icon: HeartPulse, roles: ['super_admin', 'hospital_admin', 'receptionist', 'doctor', 'cashier'] },
      { to: '/doctors', label: 'Doctors', icon: Stethoscope, roles: ['super_admin', 'hospital_admin', 'receptionist', 'doctor', 'patient'] },
      { to: '/appointments', label: 'Appointments', icon: CalendarCheck, roles: ['doctor', 'receptionist', 'hospital_admin', 'super_admin', 'patient'] },
      { to: '/consultations', label: 'Consultation Notes', icon: ClipboardList, roles: ['super_admin', 'hospital_admin', 'doctor', 'patient'] },
      { to: '/prescriptions', label: 'Prescriptions', icon: Pill, roles: ['super_admin', 'hospital_admin', 'doctor', 'patient', 'pharmacist'] },
      { to: '/medical-records', label: 'Medical Records', icon: FileText, roles: ['doctor', 'receptionist', 'hospital_admin', 'super_admin', 'lab_technician', 'patient'] },
      { to: '/laboratory', label: 'Laboratory', icon: FlaskConical, roles: ['lab_technician', 'doctor', 'hospital_admin', 'super_admin', 'patient'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/pharmacy', label: 'Pharmacy', icon: PillBottle, roles: ['super_admin', 'hospital_admin', 'pharmacist', 'doctor'] },
      { to: '/inventory', label: 'Inventory', icon: Boxes, roles: ['super_admin', 'hospital_admin', 'pharmacist'] },
      { to: '/billing', label: 'Billing', icon: Receipt, roles: ['super_admin', 'hospital_admin', 'cashier'] },
      { to: '/admissions', label: 'Admissions & Beds', icon: BedDouble, roles: ['super_admin', 'hospital_admin', 'doctor', 'receptionist'] },
      { to: '/emergency', label: 'Emergency', icon: Siren, roles: ['super_admin', 'hospital_admin', 'doctor', 'receptionist'] },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['super_admin', 'hospital_admin', 'cashier', 'pharmacist'] },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/users', label: 'Users', icon: Users, roles: ['super_admin', 'hospital_admin'] },
      { to: '/departments', label: 'Departments', icon: Building2, roles: null },
      { to: '/notifications', label: 'Notifications', icon: Bell, roles: null },
      { to: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck, roles: ['super_admin', 'hospital_admin'] },
    ],
  },
]

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  hospital_admin: 'Hospital Admin',
  doctor: 'Doctor',
  receptionist: 'Receptionist',
  pharmacist: 'Pharmacist',
  lab_technician: 'Lab Technician',
  cashier: 'Cashier',
  patient: 'Patient',
}

/** Where to send someone right after login, based on their role. */
export function getDefaultRoute(role) {
  if (['super_admin', 'hospital_admin', 'doctor'].includes(role)) return '/dashboard'
  if (role === 'pharmacist') return '/pharmacy'
  if (role === 'cashier') return '/billing'
  if (role === 'lab_technician') return '/laboratory'
  return '/appointments'
}

/**
 * Flat { '/path': ['role', ...] | null } map built from NAV_GROUPS, so
 * App.jsx can reuse the exact same role rules for route-level protection
 * (redirects a role away from a page it isn't allowed to call the API for)
 * instead of maintaining a second copy of the same list.
 */
export const ROUTE_ROLES = Object.fromEntries(
  NAV_GROUPS.flatMap((group) => group.items.map((item) => [item.to, item.roles]))
)

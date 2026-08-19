/**
 * config/pageTitles.js
 *
 * Maps each route path to the title shown in the top bar.
 * We use this instead of React Router's `useMatches()` because that hook
 * only works with a "data router" (createBrowserRouter), and this app
 * uses the simpler <BrowserRouter> instead.
 */
export const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/departments': 'Departments',
  '/users': 'Users',
  '/doctors': 'Doctors',
  '/patients': 'Patients',
  '/appointments': 'Appointments',
  '/consultations': 'Consultation Notes',
  '/prescriptions': 'Prescriptions',
  '/medical-records': 'Medical Records',
  '/laboratory': 'Laboratory',
  '/pharmacy': 'Pharmacy',
  '/inventory': 'Inventory',
  '/billing': 'Billing',
  '/admissions': 'Admissions & Beds',
  '/emergency': 'Emergency',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
  '/audit-logs': 'Audit Logs',
}

export function getPageTitle(pathname) {
  return PAGE_TITLES[pathname] || 'Overview'
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/layout/Layout'
import { getDefaultRoute, ROUTE_ROLES } from './config/nav'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Departments from './pages/modules/Departments'
import Users from './pages/modules/Users'
import Doctors from './pages/modules/Doctors'
import Patients from './pages/modules/Patients'
import Appointments from './pages/modules/Appointments'
import Consultations from './pages/modules/Consultations'
import Prescriptions from './pages/modules/Prescriptions'
import MedicalRecords from './pages/modules/MedicalRecords'
import Laboratory from './pages/modules/Laboratory'
import Pharmacy from './pages/modules/Pharmacy'
import Inventory from './pages/modules/Inventory'
import Billing from './pages/modules/Billing'
import Admissions from './pages/modules/Admissions'
import Emergency from './pages/modules/Emergency'
import Reports from './pages/modules/Reports'
import Notifications from './pages/modules/Notifications'
import AuditLogs from './pages/modules/AuditLogs'

function HomeRedirect() {
  const { role } = useAuth()
  return <Navigate to={getDefaultRoute(role)} replace />
}

/** A module page, gated to the same roles the backend allows for it. */
function ModuleRoute({ path, element }) {
  return (
    <Route
      path={path}
      element={<ProtectedRoute roles={ROUTE_ROLES[path]}>{element}</ProtectedRoute>}
    />
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        {ModuleRoute({ path: '/dashboard', element: <Dashboard /> })}
        {ModuleRoute({ path: '/departments', element: <Departments /> })}
        {ModuleRoute({ path: '/users', element: <Users /> })}
        {ModuleRoute({ path: '/doctors', element: <Doctors /> })}
        {ModuleRoute({ path: '/patients', element: <Patients /> })}
        {ModuleRoute({ path: '/appointments', element: <Appointments /> })}
        {ModuleRoute({ path: '/consultations', element: <Consultations /> })}
        {ModuleRoute({ path: '/prescriptions', element: <Prescriptions /> })}
        {ModuleRoute({ path: '/medical-records', element: <MedicalRecords /> })}
        {ModuleRoute({ path: '/laboratory', element: <Laboratory /> })}
        {ModuleRoute({ path: '/pharmacy', element: <Pharmacy /> })}
        {ModuleRoute({ path: '/inventory', element: <Inventory /> })}
        {ModuleRoute({ path: '/billing', element: <Billing /> })}
        {ModuleRoute({ path: '/admissions', element: <Admissions /> })}
        {ModuleRoute({ path: '/emergency', element: <Emergency /> })}
        {ModuleRoute({ path: '/reports', element: <Reports /> })}
        {ModuleRoute({ path: '/notifications', element: <Notifications /> })}
        {ModuleRoute({ path: '/audit-logs', element: <AuditLogs /> })}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

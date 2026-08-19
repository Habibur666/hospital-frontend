import CrudPage from '../../components/ui/CrudPage'

const config = {
  title: 'Doctors',
  description: 'Doctor profiles linked to a user account with role "doctor".',
  endpoint: '/doctors',
  paginated: true,
  searchable: false,
  canCreate: ['super_admin', 'hospital_admin'],
  canEdit: ['super_admin', 'hospital_admin', 'doctor'],
  canDelete: [],
  isOwnRow: (row, user) => ['super_admin', 'hospital_admin'].includes(user?.role) || row.user_id === user?.id,
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name', render: (r) => `Dr. ${r.first_name} ${r.last_name}` },
    { key: 'department_name', label: 'Department' },
    { key: 'specialty', label: 'Specialty' },
    { key: 'experience_years', label: 'Experience', render: (r) => (r.experience_years ? `${r.experience_years} yrs` : '—') },
    { key: 'consultation_fee', label: 'Fee', render: (r) => (r.consultation_fee ? `$${r.consultation_fee}` : '—') },
  ],
  fields: [
    {
      name: 'user_id', label: 'Doctor Account', required: true, type: 'lookup', endpoint: '/users',
      extraParams: { role: 'doctor' },
      getLabel: (u) => `${u.first_name} ${u.last_name}`, getSubLabel: (u) => u.email,
      hint: 'Only shows users already registered with the "Doctor" role.',
    },
    { name: 'department_id', label: 'Department', type: 'lookup', endpoint: '/departments', searchable: false, getLabel: (d) => d.name },
    { name: 'specialty', label: 'Specialty' },
    { name: 'qualification', label: 'Qualification' },
    { name: 'experience_years', label: 'Experience (years)', type: 'number' },
    { name: 'consultation_fee', label: 'Consultation Fee', type: 'number', step: '0.01' },
  ],
}

export default function Doctors() {
  return <CrudPage config={config} />
}

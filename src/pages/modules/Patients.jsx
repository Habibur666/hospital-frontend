import CrudPage from '../../components/ui/CrudPage'
import Badge from '../../components/ui/Badge'

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const config = {
  title: 'Patients',
  description: 'Registered patients, medical history, allergies, insurance and emergency contacts.',
  endpoint: '/patients',
  paginated: true,
  searchable: true,
  canCreate: ['super_admin', 'hospital_admin', 'receptionist', 'patient'],
  canEdit: ['super_admin', 'hospital_admin', 'receptionist', 'patient'],
  canDelete: ['super_admin', 'hospital_admin'],
  isOwnRow: (row, user) =>
    !['patient'].includes(user?.role) || row.user_id === user?.id,
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name', render: (r) => `${r.first_name} ${r.last_name}` },
    { key: 'gender', label: 'Gender', render: (r) => <Badge value={r.gender} /> },
    { key: 'phone', label: 'Phone' },
    { key: 'blood_group', label: 'Blood Group' },
    { key: 'insurance_provider', label: 'Insurance' },
  ],
  fields: [
    { name: 'first_name', label: 'First Name', required: true },
    { name: 'last_name', label: 'Last Name', required: true },
    { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
    { name: 'gender', label: 'Gender', type: 'select', options: GENDER_OPTIONS },
    { name: 'phone', label: 'Phone' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'blood_group', label: 'Blood Group', placeholder: 'e.g. O+' },
    { name: 'address', label: 'Address', type: 'textarea', fullWidth: true },
    { name: 'allergies', label: 'Allergies', type: 'textarea', fullWidth: true, placeholder: 'e.g. Penicillin, peanuts' },
    { name: 'medical_history', label: 'Medical History', type: 'textarea', fullWidth: true },
    { name: 'emergency_contact_name', label: 'Emergency Contact Name' },
    { name: 'emergency_contact_phone', label: 'Emergency Contact Phone' },
    { name: 'insurance_provider', label: 'Insurance Provider' },
    { name: 'insurance_policy_no', label: 'Insurance Policy No.' },
  ],
}

export default function Patients() {
  return <CrudPage config={config} />
}

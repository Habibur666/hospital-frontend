import CrudPage from '../../components/ui/CrudPage'

const config = {
  title: 'Departments',
  description: 'Hospital departments used to group doctors and appointments.',
  endpoint: '/departments',
  paginated: false,
  searchable: false,
  canCreate: ['super_admin', 'hospital_admin'],
  canEdit: ['super_admin', 'hospital_admin'],
  canDelete: ['super_admin', 'hospital_admin'],
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
  ],
  fields: [
    { name: 'name', label: 'Department Name', required: true, placeholder: 'e.g. Cardiology' },
    { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
  ],
}

export default function Departments() {
  return <CrudPage config={config} />
}

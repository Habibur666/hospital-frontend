import CrudPage from '../../components/ui/CrudPage'

const config = {
  title: 'Audit Logs',
  description: 'Read-only history of important actions taken across the system.',
  endpoint: '/audit-logs',
  paginated: true,
  searchable: false,
  canCreate: [],
  canEdit: [],
  canDelete: [],
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'user_id', label: 'User ID' },
    { key: 'action', label: 'Action' },
    { key: 'entity_type', label: 'Entity' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'details', label: 'Details' },
    { key: 'created_at', label: 'When' },
  ],
}

export default function AuditLogs() {
  return <CrudPage config={config} />
}

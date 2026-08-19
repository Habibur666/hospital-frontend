import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { api, apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from './Toast'
import PageHeader from './PageHeader'
import DataTable from './DataTable'
import Pagination from './Pagination'
import Modal from './Modal'
import ResourceForm from './ResourceForm'
import Button from './Button'
import { Input } from './Input'

/**
 * A full list + create + edit + delete page, driven entirely by a config
 * object (see src/config/modules/*.js for examples). This is what makes
 * it possible to have 15+ module pages without repeating the same
 * fetch/table/modal code every time.
 *
 * config = {
 *   title, description, endpoint, columns, fields,
 *   paginated: true|false,
 *   searchable: true|false,
 *   canCreate, canEdit, canDelete: array of roles or null (=everyone),
 *   extraRowActions: (row, helpers) => JSX,
 *   extraHeaderActions: (helpers) => JSX,
 *   listParams: () => object (extra query params, e.g. filters)
 * }
 */
export default function CrudPage({ config }) {
  const { role, user } = useAuth()
  const showToast = useToast()

  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)

  const entityName = config.entityName || config.title.replace(/s$/, '')
  const canCreate = !config.canCreate || config.canCreate.includes(role)
  const canEditRole = !config.canEdit || config.canEdit.includes(role)
  const canDeleteRole = !config.canDelete || config.canDelete.includes(role)

  // Some resources (e.g. a doctor's own profile) can only be edited/deleted
  // by their owner, even if the role in general is allowed to edit rows of
  // that type. `config.isOwnRow(row, user)` lets a page opt into that check;
  // pages that don't set it behave exactly as before (role-only check).
  function canEditThisRow(row) {
    if (!canEditRole) return false
    if (config.isOwnRow && !config.isOwnRow(row, user)) return false
    return true
  }
  function canDeleteThisRow(row) {
    if (!canDeleteRole) return false
    if (config.isOwnRow && !config.isOwnRow(row, user)) return false
    return true
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { ...(config.listParams ? config.listParams() : {}) }
      if (config.paginated) {
        params.page = page
        params.per_page = 10
      }
      if (config.searchable && search) params.search = search

      const res = await api.get(config.endpoint, { params })
      if (config.paginated) {
        setRows(res.data.data)
        setMeta(res.data.meta)
      } else {
        setRows(res.data.data)
      }
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, config.endpoint])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditingRow(null)
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditingRow(row)
    setModalOpen(true)
  }

  async function handleSubmit(values) {
    try {
      const payload = config.transformSubmit ? config.transformSubmit(values, editingRow) : values
      if (editingRow) {
        await api.put(`${config.endpoint}/${editingRow[config.idField || 'id']}`, payload)
        showToast(`${entityName} updated`)
      } else {
        await api.post(config.endpoint, payload)
        showToast(`${entityName} created`)
      }
      setModalOpen(false)
      load()
      return { success: true }
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
      return { errors: error?.response?.data?.errors }
    }
  }

  async function handleDelete(row) {
    if (!confirm(`Delete this record? This cannot be undone.`)) return
    try {
      await api.delete(`${config.endpoint}/${row[config.idField || 'id']}`)
      showToast('Deleted successfully')
      load()
    } catch (error) {
      showToast(apiErrorMessage(error), 'error')
    }
  }

  const helpers = { reload: load, showToast, api }

  return (
    <div>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <>
            {config.extraHeaderActions && config.extraHeaderActions(helpers)}
            {canCreate && config.fields && (
              <Button onClick={openCreate}>
                <Plus size={16} /> Add {entityName}
              </Button>
            )}
          </>
        }
      />

      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        {(config.searchable || config.filters) && (
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
            {config.searchable && (
              <div className="relative w-full max-w-xs">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder={`Search ${config.title.toLowerCase()}…`}
                  className="pl-9"
                  value={search}
                  onChange={(e) => {
                    setPage(1)
                    setSearch(e.target.value)
                  }}
                />
              </div>
            )}
            {config.filters && config.filters(helpers)}
          </div>
        )}

        <DataTable
          columns={config.columns}
          rows={rows}
          loading={loading}
          emptyText={config.emptyText}
          actions={
            config.fields || config.extraRowActions
              ? (row) => (
                  <div className="flex items-center justify-end gap-1">
                    {config.extraRowActions && config.extraRowActions(row, helpers)}
                    {canEditThisRow(row) && config.fields && (
                      <button
                        onClick={() => openEdit(row)}
                        className="rounded-md p-1.5 text-slate hover:bg-canvas hover:text-primary-500"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                    {canDeleteThisRow(row) && config.fields && (
                      <button
                        onClick={() => handleDelete(row)}
                        className="rounded-md p-1.5 text-slate hover:bg-canvas hover:text-danger-500"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                )
              : null
          }
        />

        {config.paginated && <Pagination meta={meta} onPageChange={setPage} />}
      </div>

      {config.fields && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingRow ? `Edit ${entityName}` : `Add ${entityName}`}
        >
          <ResourceForm
            fields={config.fields}
            initialValues={editingRow || config.defaultValues || {}}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  )
}

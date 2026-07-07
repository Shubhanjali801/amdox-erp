import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { settingsService } from '../../services/settingsService'
import DataTable, { Column } from '../../components/common/DataTable'

export default function Roles() {
  const rolesQ = useQuery({ queryKey: ['roles'], queryFn: settingsService.listRoles })
  const permsQ = useQuery({ queryKey: ['permissions'], queryFn: settingsService.listPermissions })

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const roles = Array.isArray(rolesQ.data) ? rolesQ.data : (rolesQ.data?.data ?? [])
  const allPerms = permsQ.data?.all ?? []

  const columns: Column<any>[] = [
    { key: 'name', header: 'Role' },
    { key: 'description', header: 'Description', render: (r) => r.description || '—' },
    { key: 'perms', header: 'Permissions', render: (r) => (r.permissions?.length ?? 0) },
    { key: 'users', header: 'Users', render: (r) => r._count?.userRoles ?? 0 },
    { key: 'isSystem', header: '', render: (r) => r.isSystem
      ? <span className="text-xs text-amber-400">system</span>
      : <button onClick={() => remove(r.id)} className="text-xs text-red-400 hover:underline">delete</button> },
  ]

  const toggle = (id: string) =>
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])

  const create = async () => {
    setSaving(true)
    try {
      await settingsService.createRole({ name, description, permissionIds: selected })
      toast.success('Role created')
      setOpen(false); setName(''); setDescription(''); setSelected([])
      rolesQ.refetch()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create role')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    try {
      await settingsService.deleteRole(id)
      toast.success('Role deleted')
      rolesQ.refetch()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Cannot delete role')
    }
  }

  const field = 'w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {/* <h1 className="text-2xl font-bold text-white">Roles &amp; Permissions</h1> */}
          <p className="text-gray-400 text-sm mt-1">Control what each role can access</p>
        </div>
        <button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition">
          + New Role
        </button>
      </div>

      <DataTable columns={columns} rows={roles} loading={rolesQ.isLoading} error={rolesQ.isError ? 'Could not load roles' : null} rowKey={(r) => r.id} />

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4" onClick={() => setOpen(false)}>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white">New Role</h2>
            <input className={field} placeholder="Role name (e.g. Auditor)" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={field} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div>
              <p className="text-sm text-gray-400 mb-2">Permissions</p>
              <div className="max-h-52 overflow-y-auto grid grid-cols-2 gap-2 bg-gray-900 rounded-lg p-3 border border-gray-700">
                {allPerms.map((p: any) => (
                  <label key={p.id} className="flex items-center gap-2 text-xs text-gray-300">
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                    {p.resource}:{p.action}
                  </label>
                ))}
                {allPerms.length === 0 && <span className="text-gray-500 text-xs">No permissions found</span>}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700">Cancel</button>
              <button onClick={create} disabled={saving || !name} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold">
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

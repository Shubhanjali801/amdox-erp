import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { settingsService } from '../../services/settingsService'
import DataTable, { Column } from '../../components/common/DataTable'

export default function Users() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: settingsService.listUsers,
  })

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)

  const rows = Array.isArray(data) ? data : (data?.data ?? [])

  const columns: Column<any>[] = [
    { key: 'name', header: 'Name', render: (u) => `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || '—' },
    { key: 'email', header: 'Email' },
    { key: 'isActive', header: 'Status', render: (u) => (
      <span className={u.isActive ? 'text-green-400' : 'text-gray-500'}>{u.isActive ? 'Active' : 'Inactive'}</span>
    )},
    { key: 'createdAt', header: 'Joined', render: (u) => u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—' },
  ]

  const create = async () => {
    setSaving(true)
    try {
      await settingsService.createUser(form)
      toast.success('User created')
      setOpen(false)
      setForm({ firstName: '', lastName: '', email: '', password: '' })
      refetch()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  const field = 'w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {/* <h1 className="text-2xl font-bold text-white">User Management</h1> */}
          <p className="text-gray-400 text-sm mt-1">People in your organisation</p>
        </div>
        <button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition">
          + Add User
        </button>
      </div>

      <DataTable columns={columns} rows={rows} loading={isLoading} error={isError ? 'Could not load users' : null} rowKey={(u) => u.id} />

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4" onClick={() => setOpen(false)}>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white">New User</h2>
            <div className="grid grid-cols-2 gap-3">
              <input className={field} placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              <input className={field} placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
            <input className={field} placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className={field} placeholder="Temp password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700">Cancel</button>
              <button onClick={create} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold">
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

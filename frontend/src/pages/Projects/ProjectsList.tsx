import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { projectService } from '../../services/projectService'
import DataTable, { Column } from '../../components/common/DataTable'
import Modal, { fieldCls, PageHeader } from '../../components/common/Modal'

const STATUS: Record<string, string> = { PLANNING: 'text-gray-400', ACTIVE: 'text-green-500', ON_HOLD: 'text-amber-400', COMPLETED: 'text-blue-400', CANCELLED: 'text-red-400' }

export default function ProjectsList() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['projects'], queryFn: () => projectService.list() })
  const rows = Array.isArray(data) ? data : (data?.data ?? [])

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [f, setF] = useState<any>({ code: '', name: '', budget: 0, clientName: '', startDate: '', endDate: '' })

  const columns: Column<any>[] = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name', render: (p) => <button onClick={() => navigate(`/projects/${p.id}`)} className="text-blue-500 hover:underline">{p.name}</button> },
    { key: 'client', header: 'Client', render: (p) => p.clientName || '—' },
    { key: 'budget', header: 'Budget', render: (p) => `$${Number(p.budget ?? 0).toLocaleString()}` },
    { key: 'tasks', header: 'Tasks', render: (p) => p._count?.tasks ?? 0 },
    { key: 'status', header: 'Status', render: (p) => <span className={STATUS[p.status] || ''}>{p.status}</span> },
  ]

  const create = async () => {
    setSaving(true)
    try {
      await projectService.create({ ...f, budget: Number(f.budget) })
      toast.success('Project created'); setOpen(false)
      setF({ code: '', name: '', budget: 0, clientName: '', startDate: '', endDate: '' }); refetch()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" subtitle="Portfolio overview"
        action={<button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">+ New Project</button>} />

      <DataTable columns={columns} rows={rows} loading={isLoading} error={isError ? 'Could not load projects' : null} rowKey={(p) => p.id} />

      <Modal open={open} onClose={() => setOpen(false)} title="New Project">
        <div className="grid grid-cols-2 gap-3">
          <input className={fieldCls} placeholder="Code (e.g. PRJ-001)" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
          <input className={fieldCls} type="number" placeholder="Budget" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} />
        </div>
        <input className={fieldCls} placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className={fieldCls} placeholder="Client name" value={f.clientName} onChange={(e) => setF({ ...f, clientName: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input className={fieldCls} type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} />
          <input className={fieldCls} type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button onClick={create} disabled={saving || !f.code || !f.name} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold">{saving ? 'Saving…' : 'Create'}</button>
        </div>
      </Modal>
    </div>
  )
}

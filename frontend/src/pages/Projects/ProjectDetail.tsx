import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { projectService } from '../../services/projectService'
import DataTable, { Column } from '../../components/common/DataTable'
import Modal, { fieldCls } from '../../components/common/Modal'

const TASK_STATUS: Record<string, string> = { TODO: 'text-gray-400', IN_PROGRESS: 'text-blue-400', IN_REVIEW: 'text-amber-400', COMPLETED: 'text-green-500', CANCELLED: 'text-red-400' }

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const projQ = useQuery({ queryKey: ['project', id], queryFn: () => projectService.getById(id!) })
  const tasksQ = useQuery({ queryKey: ['tasks', id], queryFn: () => projectService.listTasks({ projectId: id }) })

  const p = projQ.data
  const tasks = Array.isArray(tasksQ.data) ? tasksQ.data : (tasksQ.data?.data ?? [])

  const [open, setOpen] = useState(false)
  const [f, setF] = useState<any>({ title: '', priority: 'MEDIUM', estimatedHours: 0 })
  const [saving, setSaving] = useState(false)

  const columns: Column<any>[] = [
    { key: 'title', header: 'Task' },
    { key: 'priority', header: 'Priority' },
    { key: 'estimatedHours', header: 'Est. hrs', render: (t) => Number(t.estimatedHours ?? 0) },
    { key: 'status', header: 'Status', render: (t) => <span className={TASK_STATUS[t.status] || ''}>{t.status}</span> },
    { key: 'actions', header: '', render: (t) => t.status !== 'COMPLETED' ? (
      <button onClick={() => complete(t.id)} className="text-xs text-green-500 hover:underline">complete</button>
    ) : null },
  ]

  const addTask = async () => {
    setSaving(true)
    try {
      await projectService.createTask({ projectId: id, title: f.title, priority: f.priority, estimatedHours: Number(f.estimatedHours) })
      toast.success('Task added'); setOpen(false); setF({ title: '', priority: 'MEDIUM', estimatedHours: 0 }); tasksQ.refetch()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }
  const complete = async (taskId: string) => { try { await projectService.updateTask(taskId, { status: 'COMPLETED' }); toast.success('Task completed'); tasksQ.refetch() } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') } }

  if (projQ.isLoading) return <div className="text-gray-500 dark:text-gray-400">Loading…</div>
  if (projQ.isError || !p) return <div className="text-red-400">Project not found.</div>

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/projects')} className="text-sm text-blue-500 hover:underline">← Projects</button>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{p.name} <span className="text-gray-400 text-base">({p.code})</span></h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{p.clientName || '—'} · {p.status} · Budget ${Number(p.budget ?? 0).toLocaleString()}</p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h2>
        <button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm">+ Add Task</button>
      </div>
      <DataTable columns={columns} rows={tasks} loading={tasksQ.isLoading} error={tasksQ.isError ? 'Could not load tasks' : null} rowKey={(t) => t.id} />

      <Modal open={open} onClose={() => setOpen(false)} title="New Task">
        <input className={fieldCls} placeholder="Task title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <select className={fieldCls} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <input className={fieldCls} type="number" placeholder="Est. hours" value={f.estimatedHours} onChange={(e) => setF({ ...f, estimatedHours: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button onClick={addTask} disabled={saving || !f.title} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold">{saving ? '…' : 'Add'}</button>
        </div>
      </Modal>
    </div>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { hrService } from '../../services/hrService'
import DataTable, { Column } from '../../components/common/DataTable'
import Modal, { fieldCls, PageHeader } from '../../components/common/Modal'

export default function Employees() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['employees'], queryFn: () => hrService.listEmployees() })
  const rows = Array.isArray(data) ? data : (data?.data ?? [])

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [f, setF] = useState<any>({ firstName: '', lastName: '', email: '', password: '', employeeCode: '', designation: '', joinDate: '', baseSalary: 0 })

  const columns: Column<any>[] = [
    { key: 'employeeCode', header: 'Code' },
    { key: 'name', header: 'Name', render: (e) => `${e.firstName ?? e.user?.firstName ?? ''} ${e.lastName ?? e.user?.lastName ?? ''}`.trim() || '—' },
    { key: 'designation', header: 'Designation' },
    { key: 'baseSalary', header: 'Salary', render: (e) => `$${Number(e.baseSalary ?? 0).toLocaleString()}` },
    { key: 'status', header: 'Status', render: (e) => <span className={e.status === 'ACTIVE' ? 'text-green-500' : 'text-gray-500'}>{e.status || 'ACTIVE'}</span> },
  ]

  const create = async () => {
    setSaving(true)
    try {
      await hrService.createEmployee({ ...f, baseSalary: Number(f.baseSalary) })
      toast.success('Employee onboarded'); setOpen(false)
      setF({ firstName: '', lastName: '', email: '', password: '', employeeCode: '', designation: '', joinDate: '', baseSalary: 0 }); refetch()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Employees" subtitle="Workforce directory"
        action={<button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">+ Onboard Employee</button>} />

      <DataTable columns={columns} rows={rows} loading={isLoading} error={isError ? 'Could not load employees' : null} rowKey={(e) => e.id} />

      <Modal open={open} onClose={() => setOpen(false)} title="Onboard Employee">
        <div className="grid grid-cols-2 gap-3">
          <input className={fieldCls} placeholder="First name" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} />
          <input className={fieldCls} placeholder="Last name" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} />
        </div>
        <input className={fieldCls} placeholder="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input className={fieldCls} placeholder="Temp password (Aa1!min8)" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input className={fieldCls} placeholder="Employee code" value={f.employeeCode} onChange={(e) => setF({ ...f, employeeCode: e.target.value })} />
          <input className={fieldCls} placeholder="Designation" value={f.designation} onChange={(e) => setF({ ...f, designation: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className={fieldCls} type="date" value={f.joinDate} onChange={(e) => setF({ ...f, joinDate: e.target.value })} />
          <input className={fieldCls} type="number" placeholder="Base salary" value={f.baseSalary} onChange={(e) => setF({ ...f, baseSalary: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button onClick={create} disabled={saving || !f.email || !f.employeeCode} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold">{saving ? 'Saving…' : 'Onboard'}</button>
        </div>
      </Modal>
    </div>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { hrService } from '../../services/hrService'
import DataTable, { Column } from '../../components/common/DataTable'
import Modal, { fieldCls, PageHeader } from '../../components/common/Modal'

const STATUS = ['PRESENT', 'ABSENT', 'HALF_DAY', 'HOLIDAY', 'WORK_FROM_HOME']
const time = (v: any) => (v ? new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—')

export default function Attendance() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['attendance'], queryFn: () => hrService.listAttendance() })
  const empQ = useQuery({ queryKey: ['employees'], queryFn: () => hrService.listEmployees() })
  const rows = Array.isArray(data) ? data : (data?.data ?? [])
  const employees = Array.isArray(empQ.data) ? empQ.data : (empQ.data?.data ?? [])

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [f, setF] = useState<any>({ employeeId: '', date: '', clockIn: '', clockOut: '', status: 'PRESENT' })

  const columns: Column<any>[] = [
    { key: 'employee', header: 'Employee', render: (a) => a.employee?.employeeCode || a.employeeId?.slice(0, 8) || '—' },
    { key: 'date', header: 'Date', render: (a) => a.date ? new Date(a.date).toLocaleDateString() : '—' },
    { key: 'clockIn', header: 'Check-in', render: (a) => time(a.clockIn) },
    { key: 'clockOut', header: 'Check-out', render: (a) => time(a.clockOut) },
    { key: 'status', header: 'Status', render: (a) => <span className="text-blue-500">{a.status || '—'}</span> },
  ]

  const create = async () => {
    setSaving(true)
    try {
      // combine date + time into ISO datetimes
      const clockIn = f.clockIn ? `${f.date}T${f.clockIn}:00` : undefined
      const clockOut = f.clockOut ? `${f.date}T${f.clockOut}:00` : undefined
      await hrService.createAttendance({ employeeId: f.employeeId, date: f.date, clockIn, clockOut, status: f.status })
      toast.success('Attendance recorded'); setOpen(false)
      setF({ employeeId: '', date: '', clockIn: '', clockOut: '', status: 'PRESENT' }); refetch()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="Daily clock-in / clock-out records"
        action={<button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">+ Record Attendance</button>} />

      <DataTable columns={columns} rows={rows} loading={isLoading} error={isError ? 'Could not load attendance' : null} rowKey={(a) => a.id} />

      <Modal open={open} onClose={() => setOpen(false)} title="Record Attendance">
        <select className={fieldCls} value={f.employeeId} onChange={(e) => setF({ ...f, employeeId: e.target.value })}>
          <option value="">Select employee…</option>
          {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.employeeCode} — {emp.designation}</option>)}
        </select>
        <input className={fieldCls} type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Check-in</label>
            <input className={fieldCls} type="time" value={f.clockIn} onChange={(e) => setF({ ...f, clockIn: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Check-out</label>
            <input className={fieldCls} type="time" value={f.clockOut} onChange={(e) => setF({ ...f, clockOut: e.target.value })} />
          </div>
        </div>
        <select className={fieldCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button onClick={create} disabled={saving || !f.employeeId || !f.date} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold">{saving ? 'Saving…' : 'Record'}</button>
        </div>
      </Modal>
    </div>
  )
}

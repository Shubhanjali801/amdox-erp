import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { hrService } from '../../services/hrService'
import DataTable, { Column } from '../../components/common/DataTable'
import Modal, { fieldCls, PageHeader } from '../../components/common/Modal'

const STATUS: Record<string, string> = { PENDING: 'text-amber-400', APPROVED: 'text-green-500', REJECTED: 'text-red-400' }

export default function Leave() {
  const leaveQ = useQuery({ queryKey: ['leave'], queryFn: () => hrService.listLeave() })
  const typesQ = useQuery({ queryKey: ['leave-types'], queryFn: () => hrService.listLeaveTypes() })
  const empQ = useQuery({ queryKey: ['employees'], queryFn: () => hrService.listEmployees() })

  const rows = Array.isArray(leaveQ.data) ? leaveQ.data : (leaveQ.data?.data ?? [])
  const types = Array.isArray(typesQ.data) ? typesQ.data : (typesQ.data?.data ?? [])
  const employees = Array.isArray(empQ.data) ? empQ.data : (empQ.data?.data ?? [])

  const [reqOpen, setReqOpen] = useState(false)
  const [typeOpen, setTypeOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [req, setReq] = useState<any>({ employeeId: '', leaveTypeId: '', startDate: '', endDate: '', reason: '' })
  const [type, setType] = useState<any>({ name: '', daysAllowedPerYear: 12, isPaid: true })

  const approve = async (id: string) => { try { await hrService.approveLeave(id); toast.success('Approved'); leaveQ.refetch() } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') } }
  const reject = async (id: string) => { try { await hrService.rejectLeave(id); toast.success('Rejected'); leaveQ.refetch() } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') } }

  const createReq = async () => {
    setSaving(true)
    try {
      await hrService.createLeave(req)
      toast.success('Leave requested'); setReqOpen(false)
      setReq({ employeeId: '', leaveTypeId: '', startDate: '', endDate: '', reason: '' }); leaveQ.refetch()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }
  const createType = async () => {
    setSaving(true)
    try {
      await hrService.createLeaveType({ ...type, daysAllowedPerYear: Number(type.daysAllowedPerYear) })
      toast.success('Leave type added'); setTypeOpen(false)
      setType({ name: '', daysAllowedPerYear: 12, isPaid: true }); typesQ.refetch()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }

  const columns: Column<any>[] = [
    { key: 'employee', header: 'Employee', render: (l) => l.employee?.employeeCode || '—' },
    { key: 'type', header: 'Type', render: (l) => l.leaveType?.name || '—' },
    { key: 'from', header: 'From', render: (l) => l.startDate ? new Date(l.startDate).toLocaleDateString() : '—' },
    { key: 'to', header: 'To', render: (l) => l.endDate ? new Date(l.endDate).toLocaleDateString() : '—' },
    { key: 'status', header: 'Status', render: (l) => <span className={STATUS[l.status] || ''}>{l.status}</span> },
    { key: 'actions', header: '', render: (l) => l.status === 'PENDING' ? (
      <div className="flex gap-3">
        <button onClick={() => approve(l.id)} className="text-xs text-green-500 hover:underline">approve</button>
        <button onClick={() => reject(l.id)} className="text-xs text-red-400 hover:underline">reject</button>
      </div>
    ) : null },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Leave Management" subtitle="Requests &amp; approvals"
        action={
          <div className="flex gap-2">
            <button onClick={() => setTypeOpen(true)} className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800">+ Leave Type</button>
            <button onClick={() => setReqOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">+ Request Leave</button>
          </div>
        } />

      <DataTable columns={columns} rows={rows} loading={leaveQ.isLoading} error={leaveQ.isError ? 'Could not load leave requests' : null} rowKey={(l) => l.id} />

      {/* Request leave */}
      <Modal open={reqOpen} onClose={() => setReqOpen(false)} title="Request Leave">
        <select className={fieldCls} value={req.employeeId} onChange={(e) => setReq({ ...req, employeeId: e.target.value })}>
          <option value="">Select employee…</option>
          {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.employeeCode} — {emp.designation}</option>)}
        </select>
        <select className={fieldCls} value={req.leaveTypeId} onChange={(e) => setReq({ ...req, leaveTypeId: e.target.value })}>
          <option value="">Select leave type…</option>
          {types.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {types.length === 0 && <p className="text-xs text-amber-500">Add a leave type first (button above).</p>}
        <div className="grid grid-cols-2 gap-3">
          <input className={fieldCls} type="date" value={req.startDate} onChange={(e) => setReq({ ...req, startDate: e.target.value })} />
          <input className={fieldCls} type="date" value={req.endDate} onChange={(e) => setReq({ ...req, endDate: e.target.value })} />
        </div>
        <input className={fieldCls} placeholder="Reason" value={req.reason} onChange={(e) => setReq({ ...req, reason: e.target.value })} />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setReqOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button onClick={createReq} disabled={saving || !req.employeeId || !req.leaveTypeId} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold">{saving ? 'Saving…' : 'Request'}</button>
        </div>
      </Modal>

      {/* Add leave type */}
      <Modal open={typeOpen} onClose={() => setTypeOpen(false)} title="New Leave Type">
        <input className={fieldCls} placeholder="Name (e.g. Annual Leave)" value={type.name} onChange={(e) => setType({ ...type, name: e.target.value })} />
        <input className={fieldCls} type="number" placeholder="Days allowed per year" value={type.daysAllowedPerYear} onChange={(e) => setType({ ...type, daysAllowedPerYear: e.target.value })} />
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <input type="checkbox" checked={type.isPaid} onChange={(e) => setType({ ...type, isPaid: e.target.checked })} /> Paid leave
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setTypeOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button onClick={createType} disabled={saving || !type.name} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold">{saving ? 'Saving…' : 'Add'}</button>
        </div>
      </Modal>
    </div>
  )
}

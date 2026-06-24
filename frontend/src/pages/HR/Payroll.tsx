import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { hrService } from '../../services/hrService'
import DataTable, { Column } from '../../components/common/DataTable'
import Modal, { fieldCls, PageHeader } from '../../components/common/Modal'

const money = (n: any) => `$${Number(n ?? 0).toLocaleString()}`

export default function Payroll() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['payroll'], queryFn: () => hrService.listPayroll() })
  const rows = Array.isArray(data) ? data : (data?.data ?? [])

  const [open, setOpen] = useState(false)
  const [period, setPeriod] = useState('')
  const [saving, setSaving] = useState(false)

  // payslip detail
  const [runId, setRunId] = useState<string | null>(null)
  const detailQ = useQuery({ queryKey: ['payroll-run', runId], queryFn: () => hrService.getPayrollRun(runId!), enabled: !!runId })
  const slips = detailQ.data?.payslips ?? []

  const columns: Column<any>[] = [
    { key: 'period', header: 'Period' },
    { key: 'payslips', header: 'Payslips', render: (r) => r._count?.payslips ?? r.payslips?.length ?? 0 },
    { key: 'gross', header: 'Gross', render: (r) => money(r.totalGross) },
    { key: 'net', header: 'Net', render: (r) => money(r.totalNet) },
    { key: 'status', header: 'Status', render: (r) => <span className="text-green-500">{r.status || 'COMPLETED'}</span> },
    { key: 'actions', header: '', render: (r) => (
      <button onClick={() => setRunId(r.id)} className="text-xs text-blue-500 hover:underline">view payslips</button>
    )},
  ]

  const slipCols: Column<any>[] = [
    { key: 'emp', header: 'Employee', render: (s) => s.employee?.employeeCode || '—' },
    { key: 'basic', header: 'Basic', render: (s) => money(s.basicSalary) },
    { key: 'allow', header: 'Allowances', render: (s) => money(s.totalAllowances) },
    { key: 'gross', header: 'Gross', render: (s) => money(s.grossSalary) },
    { key: 'ded', header: 'Deductions', render: (s) => <span className="text-amber-500">−{money(s.totalDeductions)}</span> },
    { key: 'net', header: 'Net Pay', render: (s) => <span className="text-green-500 font-semibold">{money(s.netSalary)}</span> },
  ]

  const run = async () => {
    setSaving(true)
    try {
      await hrService.runPayroll({ period })
      toast.success(`Payroll run for ${period}`); setOpen(false); setPeriod(''); refetch()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Payroll" subtitle="Monthly payroll runs (gross → net)"
        action={<button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">▶ Run Payroll</button>} />

      <DataTable columns={columns} rows={rows} loading={isLoading} error={isError ? 'Could not load payroll runs' : null} rowKey={(r) => r.id} />

      <Modal open={open} onClose={() => setOpen(false)} title="Run Payroll">
        <p className="text-sm text-gray-500 dark:text-gray-400">Processes all active employees for the period.</p>
        <input className={fieldCls} placeholder="Period (e.g. 2026-07)" value={period} onChange={(e) => setPeriod(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button onClick={run} disabled={saving || !period} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold">{saving ? 'Running…' : 'Run'}</button>
        </div>
      </Modal>

      {/* Payslip breakdown */}
      <Modal open={!!runId} onClose={() => setRunId(null)} title={`Payslips — ${detailQ.data?.period || ''}`} wide>
        {detailQ.isLoading ? (
          <div className="text-gray-500 dark:text-gray-400 py-6 text-center">Loading payslips…</div>
        ) : (
          <DataTable columns={slipCols} rows={slips} empty="No payslips" rowKey={(s) => s.id} />
        )}
        <div className="flex justify-end pt-3">
          <button onClick={() => setRunId(null)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Close</button>
        </div>
      </Modal>
    </div>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { financeService } from '../../services/financeService'
import DataTable, { Column } from '../../components/common/DataTable'
import Modal, { fieldCls, PageHeader } from '../../components/common/Modal'

const num = (v: any) => Number(v ?? 0)
const STATUS: Record<string, string> = {
  DRAFT: 'text-gray-400', PENDING: 'text-gray-400', APPROVED: 'text-blue-400',
  PARTIALLY_PAID: 'text-amber-400', PAID: 'text-green-400', OVERDUE: 'text-red-400', CANCELLED: 'text-red-400',
}

export default function Receivables() {
  const arQ = useQuery({ queryKey: ['ar'], queryFn: () => financeService.listAR() })
  const rows = Array.isArray(arQ.data) ? arQ.data : (arQ.data?.data ?? [])

  const [open, setOpen] = useState(false)
  const [pay, setPay] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  // Invoice with a row action in flight — blocks double-click double-submits.
  const [busy, setBusy] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ invoiceNumber: '', customerId: '', issueDate: '', dueDate: '', desc: '', quantity: 1, unitPrice: 0 })
  const [payForm, setPayForm] = useState({ amount: 0, method: 'BANK_TRANSFER' })

  const columns: Column<any>[] = [
    { key: 'invoiceNumber', header: 'Invoice #' },
    { key: 'customerId', header: 'Customer', render: (i) => i.customerId || '—' },
    { key: 'totalAmount', header: 'Total', render: (i) => `$${num(i.totalAmount).toLocaleString()}` },
    { key: 'status', header: 'Status', render: (i) => <span className={STATUS[i.status] || ''}>{i.status}</span> },
    { key: 'actions', header: '', render: (i) => (
      <div className="flex gap-3">
        {(i.status === 'DRAFT' || i.status === 'PENDING') && <button disabled={busy === i.id} onClick={() => approve(i.id)} className="text-xs text-blue-400 hover:underline disabled:opacity-40 disabled:no-underline">{busy === i.id ? 'approving…' : 'approve'}</button>}
        {(i.status === 'APPROVED' || i.status === 'PARTIALLY_PAID') && <button onClick={() => { setPay(i); setPayForm({ amount: num(i.totalAmount), method: 'BANK_TRANSFER' }) }} className="text-xs text-green-400 hover:underline">receive payment</button>}
      </div>
    )},
  ]

  const create = async () => {
    setSaving(true)
    try {
      await financeService.createAR({
        invoiceNumber: form.invoiceNumber, customerId: form.customerId || undefined,
        issueDate: form.issueDate, dueDate: form.dueDate,
        lineItems: [{ description: form.desc, quantity: num(form.quantity), unitPrice: num(form.unitPrice) }],
      })
      toast.success('Invoice created'); setOpen(false); arQ.refetch()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }
  const approve = async (id: string) => {
    if (busy) return
    setBusy(id)
    try { await financeService.approveAR(id); toast.success('Approved'); arQ.refetch() }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') }
    finally { setBusy(null) }
  }
  const doPay = async () => {
    if (saving) return          // guard: `disabled` can lag behind a fast double-click
    setSaving(true)
    try {
      await financeService.createPayment({ invoiceId: pay.id, amount: num(payForm.amount), method: payForm.method })
      toast.success('Payment recorded'); setPay(null); arQ.refetch()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Accounts Receivable" subtitle="Customer invoices"
        action={<button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">+ New Invoice</button>} />

      <DataTable columns={columns} rows={rows} loading={arQ.isLoading} error={arQ.isError ? 'Could not load invoices' : null} rowKey={(i) => i.id} />

      <Modal open={open} onClose={() => setOpen(false)} title="New AR Invoice">
        <input className={fieldCls} placeholder="Invoice number" value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} />
        <input className={fieldCls} placeholder="Customer name" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input className={fieldCls} type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
          <input className={fieldCls} type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <input className={fieldCls} placeholder="Line description" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input className={fieldCls} type="number" placeholder="Qty" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <input className={fieldCls} type="number" placeholder="Unit price" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button onClick={create} disabled={saving || !form.invoiceNumber} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold">{saving ? 'Saving…' : 'Create'}</button>
        </div>
      </Modal>

      <Modal open={!!pay} onClose={() => setPay(null)} title={`Receive payment — ${pay?.invoiceNumber || ''}`}>
        <input className={fieldCls} type="number" placeholder="Amount" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value as any })} />
        <select className={fieldCls} value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}>
          {['BANK_TRANSFER', 'CHEQUE', 'CARD', 'CASH', 'CRYPTO'].map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setPay(null)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button onClick={doPay} disabled={saving} className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold">{saving ? '…' : 'Record Payment'}</button>
        </div>
      </Modal>
    </div>
  )
}

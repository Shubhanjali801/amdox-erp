import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { financeService } from '../../services/financeService'
import DataTable, { Column } from '../../components/common/DataTable'
import Modal, { fieldCls, PageHeader } from '../../components/common/Modal'

const TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']

export default function Ledger() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['accounts'], queryFn: () => financeService.listAccounts() })
  const rows = Array.isArray(data) ? data : (data?.data ?? [])

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', type: 'ASSET', description: '' })

  const columns: Column<any>[] = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'type', header: 'Type', render: (a) => <span className="text-blue-500">{a.type}</span> },
    { key: 'balance', header: 'Balance', render: (a) => `${a.currency || 'USD'} ${Number(a.balance ?? 0).toLocaleString()}` },
    { key: 'actions', header: '', render: (a) => (
      <button onClick={() => del(a.id)} className="text-xs text-red-400 hover:underline">delete</button>
    )},
  ]

  const create = async () => {
    setSaving(true)
    try {
      await financeService.createAccount(form)
      toast.success('Account created'); setOpen(false)
      setForm({ code: '', name: '', type: 'ASSET', description: '' }); refetch()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }
  const del = async (id: string) => { try { await financeService.deleteAccount(id); toast.success('Deleted'); refetch() } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') } }

  return (
    <div className="space-y-6">
      <PageHeader title="General Ledger" subtitle="Chart of accounts"
        action={<button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">+ Add Account</button>} />

      <DataTable columns={columns} rows={rows} loading={isLoading} error={isError ? 'Could not load accounts' : null} rowKey={(a) => a.id} />

      <Modal open={open} onClose={() => setOpen(false)} title="New Account">
        <input className={fieldCls} placeholder="Code (e.g. 1000)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <input className={fieldCls} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className={fieldCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input className={fieldCls} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button onClick={create} disabled={saving || !form.code || !form.name} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold">{saving ? 'Saving…' : 'Create'}</button>
        </div>
      </Modal>
    </div>
  )
}

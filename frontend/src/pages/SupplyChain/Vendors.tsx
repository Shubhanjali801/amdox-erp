import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supplyChainService } from '../../services/supplyChainService'
import DataTable, { Column } from '../../components/common/DataTable'

export default function Vendors() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['vendors'], queryFn: () => supplyChainService.listVendors() })
  const rows = Array.isArray(data) ? data : (data?.data ?? [])

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', email: '', phone: '', paymentTerms: 30, currency: 'USD' })
  const [saving, setSaving] = useState(false)

  const columns: Column<any>[] = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email', render: (v) => v.email || '—' },
    { key: 'paymentTerms', header: 'Terms', render: (v) => `${v.paymentTerms ?? 0} days` },
    { key: 'status', header: 'Status', render: (v) => (
      <span className={v.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-500'}>{v.status}</span>
    )},
    { key: 'actions', header: '', render: (v) => (
      <button onClick={() => del(v.id)} className="text-xs text-red-400 hover:underline">delete</button>
    )},
  ]

  const create = async () => {
    setSaving(true)
    try {
      await supplyChainService.createVendor({ ...form, paymentTerms: Number(form.paymentTerms) })
      toast.success('Vendor created'); setOpen(false)
      setForm({ code: '', name: '', email: '', phone: '', paymentTerms: 30, currency: 'USD' })
      refetch()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create vendor')
    } finally { setSaving(false) }
  }

  const del = async (id: string) => {
    try { await supplyChainService.deleteVendor(id); toast.success('Vendor deleted'); refetch() }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') }
  }

  const field = 'w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendors</h1>
          <p className="text-gray-400 text-sm mt-1">Suppliers you purchase from</p>
        </div>
        <button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">+ Add Vendor</button>
      </div>

      <DataTable columns={columns} rows={rows} loading={isLoading} error={isError ? 'Could not load vendors' : null} rowKey={(v) => v.id} />

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4" onClick={() => setOpen(false)}>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white">New Vendor</h2>
            <input className={field} placeholder="Code (e.g. VEND-001)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <input className={field} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className={field} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className={field} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className={field} type="number" placeholder="Payment terms (days)" value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value as any })} />
              <input className={field} placeholder="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700">Cancel</button>
              <button onClick={create} disabled={saving || !form.code || !form.name} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold">{saving ? 'Saving…' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

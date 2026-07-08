import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supplyChainService } from '../../services/supplyChainService'
import DataTable, { Column } from '../../components/common/DataTable'

const num = (v: any) => Number(v ?? 0)

export default function Inventory() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['inventory'], queryFn: () => supplyChainService.listInventory() })
  const rows = Array.isArray(data) ? data : (data?.data ?? [])

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ sku: '', name: '', category: '', unitCost: 0, sellingPrice: 0, quantityOnHand: 0, reorderPoint: 0, reorderQty: 0 })
  const [saving, setSaving] = useState(false)

  // stock movement modal
  const [mv, setMv] = useState<any | null>(null)
  const [mvForm, setMvForm] = useState({ type: 'IN', quantity: 0, reference: '' })

  const columns: Column<any>[] = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'Name' },
    { key: 'category', header: 'Category', render: (i) => i.category || '—' },
    { key: 'onHand', header: 'On hand', render: (i) => {
      const low = num(i.quantityOnHand) <= num(i.reorderPoint)
      return <span className={low ? 'text-red-400 font-semibold' : 'text-gray-200'}>{num(i.quantityOnHand)}{low ? ' ⚠️' : ''}</span>
    }},
    { key: 'reorderPoint', header: 'Reorder pt', render: (i) => num(i.reorderPoint) },
    { key: 'unitCost', header: 'Unit cost', render: (i) => `$${num(i.unitCost)}` },
    { key: 'actions', header: '', render: (i) => (
      <button onClick={() => { setMv(i); setMvForm({ type: 'IN', quantity: 0, reference: '' }) }} className="text-xs text-blue-400 hover:underline">+ movement</button>
    )},
  ]

  const create = async () => {
    setSaving(true)
    try {
      await supplyChainService.createItem({
        ...form, unitCost: num(form.unitCost), sellingPrice: num(form.sellingPrice),
        quantityOnHand: num(form.quantityOnHand), reorderPoint: num(form.reorderPoint), reorderQty: num(form.reorderQty),
      })
      toast.success('Item created'); setOpen(false)
      setForm({ sku: '', name: '', category: '', unitCost: 0, sellingPrice: 0, quantityOnHand: 0, reorderPoint: 0, reorderQty: 0 })
      refetch()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to create item') }
    finally { setSaving(false) }
  }

  const addMovement = async () => {
    setSaving(true)
    try {
      await supplyChainService.addMovement(mv.id, { ...mvForm, quantity: num(mvForm.quantity) })
      toast.success('Stock updated'); setMv(null); refetch()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const field = 'w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          <p className="text-gray-400 text-sm mt-1">Stock items &amp; levels (⚠️ = below reorder point)</p>
        </div>
        <button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">+ Add Item</button>
      </div>

      <DataTable columns={columns} rows={rows} loading={isLoading} error={isError ? 'Could not load inventory' : null} rowKey={(i) => i.id} />

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4" onClick={() => setOpen(false)}>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white">New Inventory Item</h2>
            <input className={field} placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <input className={field} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className={field} placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className={field} type="number" placeholder="Unit cost" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value as any })} />
              <input className={field} type="number" placeholder="Selling price" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value as any })} />
              <input className={field} type="number" placeholder="Qty on hand" value={form.quantityOnHand} onChange={(e) => setForm({ ...form, quantityOnHand: e.target.value as any })} />
              <input className={field} type="number" placeholder="Reorder point" value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value as any })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700">Cancel</button>
              <button onClick={create} disabled={saving || !form.sku || !form.name} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold">{saving ? 'Saving…' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {mv && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4" onClick={() => setMv(null)}>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white">Stock Movement — {mv.sku}</h2>
            <select className={field} value={mvForm.type} onChange={(e) => setMvForm({ ...mvForm, type: e.target.value })}>
              <option value="IN">IN (received)</option>
              <option value="OUT">OUT (sold/used)</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
            </select>
            <input className={field} type="number" placeholder="Quantity" value={mvForm.quantity} onChange={(e) => setMvForm({ ...mvForm, quantity: e.target.value as any })} />
            <input className={field} placeholder="Reference" value={mvForm.reference} onChange={(e) => setMvForm({ ...mvForm, reference: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setMv(null)} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700">Cancel</button>
              <button onClick={addMovement} disabled={saving || num(mvForm.quantity) <= 0} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold">{saving ? '…' : 'Apply'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

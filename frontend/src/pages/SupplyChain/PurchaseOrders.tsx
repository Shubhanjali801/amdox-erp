import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supplyChainService } from '../../services/supplyChainService'
import DataTable, { Column } from '../../components/common/DataTable'

const num = (v: any) => Number(v ?? 0)
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-gray-400', SENT: 'text-blue-400', PARTIALLY_RECEIVED: 'text-amber-400',
  RECEIVED: 'text-green-400', CANCELLED: 'text-red-400',
}

export default function PurchaseOrders() {
  const posQ = useQuery({ queryKey: ['pos'], queryFn: () => supplyChainService.listPOs() })
  const vendorsQ = useQuery({ queryKey: ['vendors'], queryFn: () => supplyChainService.listVendors() })
  const itemsQ = useQuery({ queryKey: ['inventory'], queryFn: () => supplyChainService.listInventory() })

  const pos = Array.isArray(posQ.data) ? posQ.data : (posQ.data?.data ?? [])
  const vendors = Array.isArray(vendorsQ.data) ? vendorsQ.data : (vendorsQ.data?.data ?? [])
  const items = Array.isArray(itemsQ.data) ? itemsQ.data : (itemsQ.data?.data ?? [])

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  // Which PO has an action in flight. Guards against double-clicks firing two
  // concurrent requests (which would receive stock twice).
  const [busy, setBusy] = useState<string | null>(null)
  const [form, setForm] = useState<any>({
    poNumber: '', vendorId: '', taxRate: 0,
    lineItems: [{ inventoryItemId: '', description: '', quantity: 1, unitPrice: 0 }],
  })

  const columns: Column<any>[] = [
    { key: 'poNumber', header: 'PO #' },
    { key: 'vendor', header: 'Vendor', render: (p) => p.vendor?.name || '—' },
    { key: 'totalAmount', header: 'Total', render: (p) => `$${num(p.totalAmount)}` },
    { key: 'status', header: 'Status', render: (p) => <span className={STATUS_COLORS[p.status] || ''}>{p.status}</span> },
    { key: 'actions', header: '', render: (p) => (
      <div className="flex gap-3">
        {p.status === 'DRAFT' && <button disabled={busy === p.id} onClick={() => send(p.id)} className="text-xs text-blue-400 hover:underline disabled:opacity-40 disabled:no-underline">send</button>}
        {(p.status === 'SENT' || p.status === 'PARTIALLY_RECEIVED') && <button disabled={busy === p.id} onClick={() => receive(p)} className="text-xs text-green-400 hover:underline disabled:opacity-40 disabled:no-underline">{busy === p.id ? 'receiving…' : 'receive'}</button>}
        {p.status !== 'RECEIVED' && p.status !== 'CANCELLED' && <button disabled={busy === p.id} onClick={() => cancel(p.id)} className="text-xs text-red-400 hover:underline disabled:opacity-40 disabled:no-underline">cancel</button>}
      </div>
    )},
  ]

  // Patch one or more fields of line i in a single state update (functional, so
  // multiple keys don't clobber each other).
  const patchLine = (i: number, patch: Record<string, any>) =>
    setForm((prev: any) => {
      const lines = [...prev.lineItems]
      lines[i] = { ...lines[i], ...patch }
      return { ...prev, lineItems: lines }
    })
  const setLine = (i: number, k: string, v: any) => patchLine(i, { [k]: v })
  const addLine = () => setForm((prev: any) => ({ ...prev, lineItems: [...prev.lineItems, { inventoryItemId: '', description: '', quantity: 1, unitPrice: 0 }] }))

  const create = async () => {
    setSaving(true)
    try {
      await supplyChainService.createPO({
        poNumber: form.poNumber, vendorId: form.vendorId, taxRate: num(form.taxRate),
        lineItems: form.lineItems.map((l: any) => ({
          inventoryItemId: l.inventoryItemId || null, description: l.description,
          quantity: num(l.quantity), unitPrice: num(l.unitPrice),
        })),
      })
      toast.success('PO created'); setOpen(false)
      setForm({ poNumber: '', vendorId: '', taxRate: 0, lineItems: [{ inventoryItemId: '', description: '', quantity: 1, unitPrice: 0 }] })
      posQ.refetch()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to create PO') }
    finally { setSaving(false) }
  }

  const send = async (id: string) => {
    if (busy) return
    setBusy(id)
    try { await supplyChainService.sendPO(id); toast.success('PO sent'); posQ.refetch() }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') }
    finally { setBusy(null) }
  }

  const cancel = async (id: string) => {
    if (busy) return
    setBusy(id)
    try { await supplyChainService.cancelPO(id); toast.success('PO cancelled'); posQ.refetch() }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') }
    finally { setBusy(null) }
  }

  const receive = async (p: any) => {
    if (busy) return          // ignore a second click while the first is in flight
    setBusy(p.id)
    try {
      const full = await supplyChainService.getPO(p.id)
      const lines = (full.lineItems || []).map((l: any) => ({ lineItemId: l.id, receivedQty: num(l.quantity) - num(l.receivedQty) })).filter((l: any) => l.receivedQty > 0)
      if (!lines.length) { toast('Nothing left to receive', { icon: 'ℹ️' }); return }
      await supplyChainService.receivePO(p.id, { lines })
      toast.success('Goods received → stock updated'); posQ.refetch()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to receive') }
    finally { setBusy(null) }
  }

  const field = 'w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Orders</h1>
          <p className="text-gray-400 text-sm mt-1">DRAFT → SENT → RECEIVED · receiving auto-updates stock</p>
        </div>
        <button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">+ New PO</button>
      </div>

      <DataTable columns={columns} rows={pos} loading={posQ.isLoading} error={posQ.isError ? 'Could not load purchase orders' : null} rowKey={(p) => p.id} />

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4" onClick={() => setOpen(false)}>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-2xl space-y-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white">New Purchase Order</h2>
            <div className="grid grid-cols-3 gap-3">
              <input className={field} placeholder="PO number" value={form.poNumber} onChange={(e) => setForm({ ...form, poNumber: e.target.value })} />
              <select className={field} value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })}>
                <option value="">Select vendor…</option>
                {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              <input className={field} type="number" placeholder="Tax %" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
            </div>

            <p className="text-sm text-gray-400 pt-2">Line items</p>
            {form.lineItems.map((l: any, i: number) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <select className={`${field} col-span-4`} value={l.inventoryItemId} onChange={(e) => {
                  const it = items.find((x: any) => x.id === e.target.value)
                  patchLine(i, it
                    ? { inventoryItemId: e.target.value, description: it.name, unitPrice: num(it.unitCost) }
                    : { inventoryItemId: e.target.value })
                }}>
                  <option value="">Item (optional)</option>
                  {items.map((it: any) => <option key={it.id} value={it.id}>{it.sku} — {it.name}</option>)}
                </select>
                <input className={`${field} col-span-4`} placeholder="Description" value={l.description} onChange={(e) => setLine(i, 'description', e.target.value)} />
                <input className={`${field} col-span-2`} type="number" placeholder="Qty" value={l.quantity} onChange={(e) => setLine(i, 'quantity', e.target.value)} />
                <input className={`${field} col-span-2`} type="number" placeholder="Price" value={l.unitPrice} onChange={(e) => setLine(i, 'unitPrice', e.target.value)} />
              </div>
            ))}
            <button onClick={addLine} className="text-xs text-blue-400 hover:underline">+ add line</button>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700">Cancel</button>
              <button onClick={create} disabled={saving || !form.poNumber || !form.vendorId} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold">{saving ? 'Saving…' : 'Create PO'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

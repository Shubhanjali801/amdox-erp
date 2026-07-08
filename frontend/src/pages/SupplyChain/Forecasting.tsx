import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, ComposedChart } from 'recharts'
import { supplyChainService } from '../../services/supplyChainService'

const num = (v: any) => Number(v ?? 0)

export default function Forecasting() {
  const itemsQ = useQuery({ queryKey: ['inventory'], queryFn: () => supplyChainService.listInventory() })
  const healthQ = useQuery({ queryKey: ['ml-health'], queryFn: () => supplyChainService.mlHealth(), retry: false })
  const items = Array.isArray(itemsQ.data) ? itemsQ.data : (itemsQ.data?.data ?? [])

  const [itemId, setItemId] = useState('')
  const [horizon, setHorizon] = useState(6)
  const [model, setModel] = useState('lstm')
  const [result, setResult] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  const mlUp = healthQ.data?.mlServiceUp

  const generate = async () => {
    if (!itemId) return toast.error('Pick an inventory item')
    setLoading(true)
    try {
      const r = await supplyChainService.generateForecast({ inventoryItemId: itemId, modelType: model, horizon: Number(horizon) })
      setResult(r)
      toast.success(`Forecast generated (${r.model_used}, MAPE ${r.mape ?? '—'})`)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Forecast failed')
    } finally { setLoading(false) }
  }

  const chartData = (result?.forecasts || []).map((f: any) => ({
    period: f.forecastPeriod,
    predicted: num(f.predictedQty),
    low: num(f.confidenceLow),
    high: num(f.confidenceHigh),
  }))

  const field = 'px-4 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Demand Forecasting</h1>
          <p className="text-gray-400 text-sm mt-1">LSTM / Prophet demand prediction (needs 6+ months of history)</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full ${mlUp ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
          ML service: {mlUp ? 'online' : 'offline'}
        </span>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Inventory item</label>
          <select className={field} value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <option value="">Select…</option>
            {items.map((i: any) => <option key={i.id} value={i.id}>{i.sku} — {i.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Model</label>
          <select className={field} value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="lstm">LSTM</option>
            <option value="prophet">Prophet</option>
            <option value="auto">Auto</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Horizon (months)</label>
          <input className={`${field} w-24`} type="number" value={horizon} onChange={(e) => setHorizon(e.target.value as any)} />
        </div>
        <button onClick={generate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg font-semibold">
          {loading ? 'Predicting…' : 'Generate Forecast'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex gap-6 mb-4 text-sm">
            <span className="text-gray-400">Model: <span className="text-white font-medium">{result.model_used}</span></span>
            <span className="text-gray-400">MAPE: <span className="text-white font-medium">{result.mape ?? '—'}</span></span>
            <span className="text-gray-400">History: <span className="text-white font-medium">{result.history_points} mo</span></span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="period" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
              <Area type="monotone" dataKey="high" stroke="none" fill="#3b82f6" fillOpacity={0.12} />
              <Area type="monotone" dataKey="low" stroke="none" fill="#1f2937" fillOpacity={1} />
              <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

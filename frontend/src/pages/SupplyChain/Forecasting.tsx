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
  const [model, setModel] = useState('auto')
  const [result, setResult] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  const mlUp = healthQ.data?.mlServiceUp

  const generate = async () => {
    if (!itemId) return toast.error('Pick an inventory item')
    setLoading(true)
    try {
      const r = await supplyChainService.generateForecast({ inventoryItemId: itemId, modelType: model, horizon: Number(horizon) })
      setResult(r)
      toast.success(`Forecast ready — ${r.model_used} (sMAPE ${r.backtest_smape ?? '—'}%)`)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Forecast failed')
    } finally { setLoading(false) }
  }

  const chartData = (result?.forecasts || []).map((f: any) => ({
    period: f.forecastPeriod,
    predicted: num(f.predictedQty),
    low: num(f.confidenceLow),
    band: num(f.confidenceHigh) - num(f.confidenceLow),   // stacked on top of `low`
  }))

  const reorder = result?.reorder
  const field = 'px-4 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none'
  const skill = result?.skill_vs_naive_pct

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Demand Forecasting</h1>
          <p className="text-gray-400 text-sm mt-1">
            Auto-selects the best model per item, validated by backtest vs a naive baseline, and recommends when to reorder.
          </p>
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
            <option value="auto">Auto (recommended)</option>
            <option value="prophet">Prophet</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Horizon (periods)</label>
          <input className={`${field} w-24`} type="number" value={horizon} onChange={(e) => setHorizon(e.target.value as any)} />
        </div>
        <button onClick={generate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg font-semibold">
          {loading ? 'Predicting…' : 'Generate Forecast'}
        </button>
      </div>

      {result && (
        <>
          {/* Honest accuracy metrics */}
          <div className="grid sm:grid-cols-4 gap-4">
            <Stat label="Model chosen" value={result.model_used}
                  sub={result.candidates_tried ? `vs ${Object.keys(result.candidates_tried).length} candidates` : undefined} />
            <Stat label="Accuracy (sMAPE, backtested)"
                  value={result.backtest_smape != null ? `${result.backtest_smape}%` : '—'}
                  sub="rolling-origin validation" />
            <Stat label="Beats naive baseline"
                  value={skill != null ? `${skill > 0 ? '+' : ''}${skill}%` : '—'}
                  good={skill != null && skill >= 0} bad={skill != null && skill < 0} />
            <Stat label="History used" value={`${result.history_points} periods`} />
          </div>

          {/* Reorder recommendation — the actionable output */}
          {reorder && (
            <div className={`rounded-xl p-5 border ${reorder.should_reorder ? 'bg-amber-950/40 border-amber-700' : 'bg-gray-800 border-gray-700'}`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold text-white">
                    {reorder.should_reorder ? '⚠️ Reorder recommended' : '✅ Stock is sufficient'}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Based on forecast demand over a {reorder.lead_time_periods}-period lead time + safety stock.
                  </p>
                </div>
                {reorder.should_reorder && (
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Suggested order</div>
                    <div className="text-2xl font-bold text-amber-300">{Math.round(reorder.suggested_order_qty)} units</div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
                <Mini label="Reorder point" value={Math.round(reorder.reorder_point)} />
                <Mini label="Demand / lead time" value={Math.round(reorder.expected_demand_over_lead)} />
                <Mini label="Safety stock" value={Math.round(reorder.safety_stock)} />
                <Mini label="Current stock" value={reorder.current_stock != null ? Math.round(reorder.current_stock) : '—'} />
              </div>
            </div>
          )}

          {/* Forecast chart with confidence band */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="font-semibold text-white mb-4">Forecast (shaded = ~80% confidence band)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="period" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
                <Area type="monotone" dataKey="low" stackId="ci" stroke="none" fill="transparent" />
                <Area type="monotone" dataKey="band" stackId="ci" stroke="none" fill="#3b82f6" fillOpacity={0.15} />
                <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, sub, good, bad }: { label: string; value: any; sub?: string; good?: boolean; bad?: boolean }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="text-xs text-gray-400">{label}</div>
      <div className={`text-xl font-bold mt-1 ${good ? 'text-green-400' : bad ? 'text-red-400' : 'text-white'}`}>{value}</div>
      {sub && <div className="text-[11px] text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}

function Mini({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-gray-400 text-xs">{label}</div>
      <div className="text-white font-semibold">{value}</div>
    </div>
  )
}

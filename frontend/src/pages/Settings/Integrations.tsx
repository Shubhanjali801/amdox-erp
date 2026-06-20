import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { settingsService } from '../../services/settingsService'

const KNOWN = [
  { key: 'slack', label: 'Slack', icon: '💬', desc: 'Post alerts to a Slack channel' },
  { key: 'stripe', label: 'Stripe', icon: '💳', desc: 'Online payments' },
  { key: 'quickbooks', label: 'QuickBooks', icon: '📒', desc: 'Sync accounting data' },
]

export default function Integrations() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['integrations'],
    queryFn: settingsService.listIntegrations,
  })

  const active: Record<string, any> = {}
  ;(Array.isArray(data) ? data : []).forEach((i: any) => { active[i.key] = i })

  const [busy, setBusy] = useState<string | null>(null)

  const toggle = async (key: string, enabled: boolean) => {
    setBusy(key)
    try {
      await settingsService.upsertIntegration(key, { enabled, config: {} })
      toast.success(`${key} ${enabled ? 'enabled' : 'disabled'}`)
      refetch()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed')
    } finally {
      setBusy(null)
    }
  }

  if (isLoading) return <div className="text-gray-400">Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="text-gray-400 text-sm mt-1">Connect Amdox ERP to the tools you use</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {KNOWN.map((it) => {
          const on = active[it.key]?.enabled
          return (
            <div key={it.key} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{it.icon}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${on ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                  {on ? 'Connected' : 'Off'}
                </span>
              </div>
              <h3 className="font-semibold text-white">{it.label}</h3>
              <p className="text-gray-400 text-sm mb-4">{it.desc}</p>
              <button
                onClick={() => toggle(it.key, !on)}
                disabled={busy === it.key}
                className={`w-full py-2 rounded-lg text-sm font-semibold transition ${
                  on ? 'bg-gray-700 text-gray-200 hover:bg-red-600 hover:text-white' : 'bg-[#0067c0] text-white hover:bg-[#005a9e]'
                }`}
              >
                {busy === it.key ? '…' : on ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

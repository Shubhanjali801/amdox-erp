import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { settingsService } from '../../services/settingsService'

export default function General() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings,
  })

  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) { setName(data.name || ''); setLogoUrl(data.logoUrl || '') }
  }, [data])

  const save = async () => {
    setSaving(true)
    try {
      await settingsService.updateSettings({ name, logoUrl })
      toast.success('Settings saved')
      refetch()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <div className="text-gray-400">Loading…</div>
  if (isError) return <div className="text-red-400">Could not load settings.</div>

  const field = 'w-full px-4 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none'

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        {/* <h1 className="text-2xl font-bold text-white">General Settings</h1> */}
        <p className="text-gray-400 text-sm mt-1">Your company profile and preferences</p>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Company name</label>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Logo URL</label>
          <input className={field} value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Plan</span>
            <div className="text-gray-200 font-medium">{data?.plan || '—'}</div>
          </div>
          <div>
            <span className="text-gray-500">Status</span>
            <div className="text-gray-200 font-medium">{data?.isActive ? 'Active' : 'Inactive'}</div>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg font-semibold transition"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

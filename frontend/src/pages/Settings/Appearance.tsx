import { useTheme } from '../../context/ThemeContext'

export default function Appearance() {
  const { theme, setTheme } = useTheme()

  const Option = ({ value, label, icon, desc }: { value: 'dark' | 'light'; label: string; icon: string; desc: string }) => {
    const active = theme === value
    return (
      <button
        onClick={() => setTheme(value)}
        className={`text-left rounded-xl border p-5 transition w-full ${
          active
            ? 'border-blue-500 ring-2 ring-blue-500/40'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
        } bg-white dark:bg-gray-800`}
      >
        <div className="flex items-center justify-between">
          <span className="text-2xl">{icon}</span>
          {active && <span className="text-xs text-blue-500 font-semibold">Active</span>}
        </div>
        <h3 className="mt-2 font-semibold text-gray-900 dark:text-white">{label}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
        {/* mini preview */}
        <div className={`mt-3 rounded-lg overflow-hidden border ${value === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={value === 'dark' ? 'bg-gray-950' : 'bg-gray-100'}>
            <div className={`h-2 ${value === 'dark' ? 'bg-gray-800' : 'bg-white'}`} />
            <div className="flex">
              <div className={`w-1/4 h-10 ${value === 'dark' ? 'bg-gray-900' : 'bg-white'}`} />
              <div className="flex-1 p-2 flex gap-1">
                <div className="h-6 w-1/3 rounded bg-blue-500/70" />
                <div className={`h-6 w-1/3 rounded ${value === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} />
              </div>
            </div>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Appearance</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Choose how Amdox ERP looks. Saved to this browser.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Option value="dark" label="Dark" icon="🌙" desc="Default — easy on the eyes" />
        <Option value="light" label="Light" icon="☀️" desc="Bright, high-contrast" />
      </div>
    </div>
  )
}

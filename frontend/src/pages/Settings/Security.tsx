import { useState } from 'react'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'

export default function Security() {
  const user = authService.getCurrentUser() as any
  const [enabled, setEnabled] = useState<boolean>(!!user?.mfaEnabled)
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const startSetup = async () => {
    setBusy(true)
    try {
      const r = await authService.mfaSetup()
      setQr(r.qrDataUrl)
      setSecret(r.secret)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not start MFA setup')
    } finally {
      setBusy(false)
    }
  }

  const confirmEnable = async () => {
    setBusy(true)
    try {
      await authService.mfaEnable(code)
      toast.success('Two-factor authentication enabled')
      setEnabled(true); setQr(null); setCode('')
      // keep local user in sync
      if (user) localStorage.setItem('user', JSON.stringify({ ...user, mfaEnabled: true }))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Invalid code')
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true)
    try {
      await authService.mfaDisable(code)
      toast.success('Two-factor authentication disabled')
      setEnabled(false); setCode('')
      if (user) localStorage.setItem('user', JSON.stringify({ ...user, mfaEnabled: false }))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Invalid code')
    } finally {
      setBusy(false)
    }
  }

  const codeField = 'w-40 px-4 py-2 text-center text-xl tracking-[0.4em] rounded bg-gray-900 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none'

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        {/* <h2 className="text-xl font-bold text-white">Security</h2> */}
        <p className="text-gray-400 text-sm mt-1">Protect your account with two-factor authentication (2FA)</p>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Authenticator app (TOTP)</h3>
            <p className="text-gray-400 text-sm">Google Authenticator, Authy, 1Password, etc.</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${enabled ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {/* Enabled → allow disable */}
        {enabled && (
          <div className="space-y-3 border-t border-gray-700 pt-4">
            <p className="text-sm text-gray-400">Enter a current code to turn 2FA off.</p>
            <div className="flex items-center gap-3">
              <input className={codeField} value={code} maxLength={6} inputMode="numeric"
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" />
              <button onClick={disable} disabled={busy || code.length !== 6}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold">
                Disable 2FA
              </button>
            </div>
          </div>
        )}

        {/* Disabled, not yet setting up */}
        {!enabled && !qr && (
          <button onClick={startSetup} disabled={busy}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold">
            {busy ? 'Loading…' : 'Set up 2FA'}
          </button>
        )}

        {/* Setup in progress → show QR + verify */}
        {!enabled && qr && (
          <div className="space-y-4 border-t border-gray-700 pt-4">
            <p className="text-sm text-gray-300">1. Scan this QR with your authenticator app:</p>
            <img src={qr} alt="MFA QR" className="w-44 h-44 bg-white rounded-lg p-2" />
            <p className="text-xs text-gray-500">Or enter this key manually: <span className="font-mono text-gray-300">{secret}</span></p>
            <p className="text-sm text-gray-300">2. Enter the 6-digit code to confirm:</p>
            <div className="flex items-center gap-3">
              <input className={codeField} value={code} maxLength={6} inputMode="numeric"
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" />
              <button onClick={confirmEnable} disabled={busy || code.length !== 6}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold">
                Verify & Enable
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

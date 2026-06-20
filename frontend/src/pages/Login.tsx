import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { authService } from '../services/authService'
import PublicNavbar from '../components/common/PublicNavbar'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type LoginData = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [mfaStep, setMfaStep] = useState(false)
  const [mfaToken, setMfaToken] = useState('')
  const { register, handleSubmit, getValues, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@amdox.com', password: '' },
  })

  const doLogin = async (creds: LoginData & { mfaToken?: string }) => {
    const res = await authService.login(creds)
    if (res.mfaRequired) {
      setMfaStep(true)
      toast('Enter your authenticator code', { icon: '🔐' })
      return
    }
    toast.success('Welcome back!')
    navigate('/dashboard')
  }

  const onSubmit = async (data: LoginData) => {
    setSubmitting(true)
    try {
      await doLogin(data)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login failed — check your credentials')
    } finally {
      setSubmitting(false)
    }
  }

  const submitMfa = async () => {
    setSubmitting(true)
    try {
      await doLogin({ ...getValues(), mfaToken })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid code')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicNavbar />
      <div className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-2">Amdox ERP</h1>
        <p className="text-center text-gray-500 mb-8">Sign in to your account</p>

        {mfaStep ? (
          <div className="space-y-4">
            <div className="text-center text-3xl">🔐</div>
            <p className="text-center text-sm text-gray-600">
              Two-factor authentication is on. Enter the 6-digit code from your authenticator app.
            </p>
            <input
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              autoFocus
              className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="000000"
            />
            <button
              onClick={submitMfa}
              disabled={submitting || mfaToken.length !== 6}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded font-semibold transition"
            >
              {submitting ? 'Verifying…' : 'Verify & Sign In'}
            </button>
            <button onClick={() => { setMfaStep(false); setMfaToken('') }} className="w-full text-xs text-gray-400 hover:text-gray-600">
              ← Back
            </button>
          </div>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="you@company.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              {...register('password')}
              type="password"
              className="w-full px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-xs text-blue-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded font-semibold transition"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          New company?{' '}
          <button onClick={() => navigate('/register')} className="text-blue-600 hover:underline">
            Register here
          </button>
        </p>
      </div>
      </div>
    </div>
  )
}

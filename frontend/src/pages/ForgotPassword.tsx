import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { authService } from '../services/authService'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type Data = z.infer<typeof schema>

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<Data>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Data) => {
    setSubmitting(true)
    try {
      await authService.forgotPassword(data.email)
      setSent(true)
      toast.success('If that email is registered, a reset link has been sent.')
    } catch {
      toast.error('Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-2">Amdox ERP</h1>
        <p className="text-center text-gray-500 mb-8">Reset your password</p>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-4">
              📧 Check your inbox — if your email is registered, we've sent a reset link.
              It expires in 15 minutes.
            </div>
            <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline text-sm">
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registered email</label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="you@company.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded font-semibold transition"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
            <p className="text-center text-xs text-gray-400">
              <button type="button" onClick={() => navigate('/login')} className="text-blue-600 hover:underline">
                Back to sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

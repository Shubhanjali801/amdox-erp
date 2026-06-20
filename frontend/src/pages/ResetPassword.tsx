import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { authService } from '../services/authService'

const schema = z.object({
  newPassword: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Need an uppercase letter')
    .regex(/[a-z]/, 'Need a lowercase letter')
    .regex(/\d/, 'Need a number')
    .regex(/[!@#$%^&*(),.?":{}|\-<>_]/, 'Need a special character'),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })
type Data = z.infer<typeof schema>

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<Data>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Data) => {
    setSubmitting(true)
    try {
      await authService.resetPassword(token, data.newPassword)
      toast.success('Password reset! Please sign in.')
      navigate('/login')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Reset link is invalid or expired')
    } finally {
      setSubmitting(false)
    }
  }

  const field = 'w-full px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-2">Amdox ERP</h1>
        <p className="text-center text-gray-500 mb-8">Set a new password</p>

        {!token ? (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            Missing reset token. Please use the link from your email, or
            <button onClick={() => navigate('/forgot-password')} className="text-blue-600 hover:underline ml-1">
              request a new one
            </button>.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input {...register('newPassword')} type="password" className={field} placeholder="••••••••" />
              {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input {...register('confirm')} type="password" className={field} placeholder="••••••••" />
              {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded font-semibold transition"
            >
              {submitting ? 'Resetting…' : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

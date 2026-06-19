import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { authService } from '../services/authService'

const schema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type RegisterData = z.infer<typeof schema>

export default function Register() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: RegisterData) => {
    setSubmitting(true)
    try {
      await authService.register(data)
      toast.success('Company registered — welcome!')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  const field = 'w-full px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-2">Amdox ERP</h1>
        <p className="text-center text-gray-500 mb-8">Register your company</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input {...register('companyName')} className={field} placeholder="Company name" />
            {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input {...register('firstName')} className={field} placeholder="First name" />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <input {...register('lastName')} className={field} placeholder="Last name" />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>
          <div>
            <input {...register('email')} type="email" className={field} placeholder="Email" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <input {...register('password')} type="password" className={field} placeholder="Password" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded font-semibold transition"
          >
            {submitting ? 'Creating…' : 'Create Company'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

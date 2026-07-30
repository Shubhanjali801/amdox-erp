import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { authService } from '../services/authService'
import { firstAccessiblePath } from '../utils/permissions'
import PublicNavbar from '../components/common/PublicNavbar'
import { FEATURES } from '../config/featureFlags'
import { initKeycloak, keycloakLogin, completeSsoSession } from '../services/keycloak'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
  const [ssoLoading, setSsoLoading] = useState(false)

  // On mount, finish a Keycloak redirect if we're coming back from SSO: the
  // adapter processes the auth code, then we hydrate the app user from /auth/me.
  useEffect(() => {
    if (!FEATURES.KEYCLOAK_SSO) return
    let active = true
    initKeycloak().then(async (authenticated) => {
      if (!authenticated || !active) return
      setSsoLoading(true)
      try {
        await completeSsoSession()
        toast.success('Signed in with SSO')
        navigate(firstAccessiblePath())
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'This SSO account is not provisioned in Amdox ERP')
        if (active) setSsoLoading(false)
      }
    })
    return () => { active = false }
  }, [navigate])
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
    // Land on the first area this user's role can access (not always /dashboard)
    navigate(firstAccessiblePath())
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
    <div className="min-h-screen flex flex-col bg-muted/40">
      <PublicNavbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-primary">Amdox ERP</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            {ssoLoading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Signing you in via SSO…</div>
            ) : (
            <>
            {mfaStep ? (
              <div className="space-y-4">
                <div className="text-center text-3xl">🔐</div>
                <p className="text-center text-sm text-muted-foreground">
                  Two-factor authentication is on. Enter the 6-digit code from your authenticator app.
                </p>
                <Input
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  className="h-14 text-center text-2xl tracking-[0.5em]"
                  placeholder="000000"
                />
                <Button onClick={submitMfa} disabled={submitting || mfaToken.length !== 6} className="w-full">
                  {submitting ? 'Verifying…' : 'Verify & Sign In'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setMfaStep(false); setMfaToken('') }}
                  className="w-full h-auto py-1 text-xs text-muted-foreground"
                >
                  ← Back
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@company.com" {...register('email')} />
                  {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
                  {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
                </div>

                <div className="text-right">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => navigate('/forgot-password')}
                    className="h-auto p-0 text-xs"
                  >
                    Forgot password?
                  </Button>
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Signing in…' : 'Sign In'}
                </Button>
              </form>
            )}

            {!mfaStep && FEATURES.KEYCLOAK_SSO && (
              <div className="mt-4">
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={keycloakLogin}
                  disabled={submitting}
                >
                  Sign in with SSO
                </Button>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground mt-6">
              New company?{' '}
              <Button
                variant="link"
                onClick={() => navigate('/register')}
                className="h-auto p-0 text-xs"
              >
                Register here
              </Button>
            </p>
            </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

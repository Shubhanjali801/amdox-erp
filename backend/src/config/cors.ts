import { CorsOptions } from 'cors'
import { env } from './env'

// Comma-separated list from env (e.g. "https://app.vercel.app,https://www.amdox.in")
const envOrigins = (env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      env.CLIENT_URL,
      'http://localhost:3000',
      'http://localhost:5173',
      ...envOrigins,
    ]
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
}

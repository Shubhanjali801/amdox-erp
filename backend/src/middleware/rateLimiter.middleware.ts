import rateLimit from 'express-rate-limit'
import { env } from '../config/env'

// Per-IP (now that `trust proxy` is set in index.ts). An authenticated ERP
// dashboard fires many API calls per page load, so 100/15min was far too low
// for real use — it throttled legitimate navigation. 1000/15min ≈ enough for
// heavy interactive use while still blocking abusive scraping.
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.isProduction ? 1000 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
})

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again in 15 minutes.',
  },
})

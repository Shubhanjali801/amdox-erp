import { createClient } from 'redis'
import { logger } from '../utils/logger'

// Prefer a single connection URL (e.g. Upstash: rediss://default:pwd@host:port).
// Fall back to host/port/password for local dev.
const redisClient = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL })
  : createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      password: process.env.REDIS_PASSWORD || undefined,
    })

redisClient.on('connect', () => logger.info('Redis connected'))
redisClient.on('error', (err) => logger.error('Redis error:', err))
redisClient.on('reconnecting', () => logger.warn('Redis reconnecting'))

export const connectRedis = async (): Promise<void> => {
  await redisClient.connect()
}

export default redisClient

import { createClient } from 'redis'
import { logger } from '../utils/logger'

const redisClient = createClient({
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

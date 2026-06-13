import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'

import { env } from './config/env'
import { swaggerSpec } from './config/swagger'
import { corsOptions } from './config/cors'
import { connectDatabase } from './config/database'
import { connectRedis } from './config/redis'
import { logger } from './utils/logger'
import { requestLogger } from './middleware/requestLogger.middleware'
import { errorHandler } from './middleware/errorHandler.middleware'
import { globalRateLimiter } from './middleware/rateLimiter.middleware'
import router from './routes/index'

const app = express()

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet())
app.use(cors(corsOptions))
app.use(globalRateLimiter)

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// ─── Request Logging ─────────────────────────────────────────────────────────
app.use(requestLogger)

// ─── Swagger API Docs ────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/v1', router)

// ─── Error Handler (must be last) ────────────────────────────────────────────
app.use(errorHandler)

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDatabase()
    await connectRedis()

    app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`)
      logger.info(`API docs: http://localhost:${env.PORT}/api-docs`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app

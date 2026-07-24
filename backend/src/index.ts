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
import { metricsMiddleware, metricsHandler } from './config/metrics'
import router from './routes/index'
import { startWorkers } from './queues/workers'
import { createQueueDashboard, queueDashboardAuth } from './queues/board'

const app = express()

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet())
app.use(cors(corsOptions))
app.use(globalRateLimiter)

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// ─── Request Logging + Metrics ───────────────────────────────────────────────
app.use(requestLogger)
app.use(metricsMiddleware)

// Prometheus scrape endpoint
app.get('/metrics', metricsHandler)

// ─── Swagger API Docs ────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// ─── BullMQ dashboard (Basic-auth protected) ─────────────────────────────────
// Mounted under /api so the Traefik ingress (which only routes /api → backend)
// reaches it. Live URL: https://<domain>/api/admin/queues
app.use('/api/admin/queues', queueDashboardAuth(), createQueueDashboard('/api/admin/queues'))

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/v1', router)

// ─── Error Handler (must be last) ────────────────────────────────────────────
app.use(errorHandler)

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDatabase()
    await connectRedis()

    // Start BullMQ workers (email + webhook). Guarded so a queue init failure
    // never prevents the API from serving.
    try { startWorkers() } catch (e) { logger.error(`Failed to start queue workers: ${(e as Error).message}`) }

    app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`)
      logger.info(`API docs: http://localhost:${env.PORT}/api-docs`)
      logger.info(`Queue dashboard: /api/admin/queues`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app

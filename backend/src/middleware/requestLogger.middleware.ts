import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const tenantId = req.headers['x-tenant-id'] || 'none'
    logger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms tenant=${tenantId}`
    )
  })

  next()
}

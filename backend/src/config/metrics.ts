/**
 * Prometheus metrics — NFR: API Latency (P95 < 300ms) + Availability.
 * Exposes default Node metrics + an HTTP request-duration histogram.
 * Scraped by Prometheus at GET /metrics.
 */
import client from 'prom-client'
import { Request, Response, NextFunction } from 'express'

export const registry = new client.Registry()
client.collectDefaultMetrics({ register: registry })

const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.2, 0.3, 0.5, 1, 2, 5],
})
registry.registerMetric(httpDuration)

const httpTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
})
registry.registerMetric(httpTotal)

// Middleware: time each request
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const end = httpDuration.startTimer()
  res.on('finish', () => {
    const route = (req.baseUrl || '') + (req.route?.path || req.path || 'unknown')
    const labels = { method: req.method, route, status: String(res.statusCode) }
    end(labels)
    httpTotal.inc(labels)
  })
  next()
}

// GET /metrics handler
export const metricsHandler = async (_req: Request, res: Response) => {
  res.set('Content-Type', registry.contentType)
  res.end(await registry.metrics())
}

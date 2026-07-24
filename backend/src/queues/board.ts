/**
 * Bull Board — a small web UI showing every queue: waiting / active / completed
 * / failed jobs, retry attempts, and payloads. Mounted at /admin/queues behind
 * HTTP Basic auth (browser prompt), so it's safe to expose without a JWT flow.
 */
import type { RequestHandler, Router } from 'express';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { allQueues } from './index';

/** Tiny HTTP Basic-auth gate (the dashboard UI can't send a Bearer token). */
export function queueDashboardAuth(): RequestHandler {
  const user = process.env.QUEUE_DASHBOARD_USER || 'admin';
  const pass = process.env.QUEUE_DASHBOARD_PASSWORD || 'amdox-queues';
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const [, b64] = header.split(' ');
    const [u, p] = Buffer.from(b64 || '', 'base64').toString().split(':');
    if (u === user && p === pass) return next();
    res.set('WWW-Authenticate', 'Basic realm="Amdox Queues"').status(401).send('Authentication required');
  };
}

export function createQueueDashboard(basePath: string): Router {
  const adapter = new ExpressAdapter();
  adapter.setBasePath(basePath);
  createBullBoard({
    queues: allQueues.map((q) => new BullMQAdapter(q)),
    serverAdapter: adapter,
  });
  return adapter.getRouter();
}

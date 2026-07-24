/**
 * Workers — pull jobs off the queues and do the actual work by delegating to the
 * existing services. Started once from index.ts. BullMQ retries a failed job
 * (attempts + exponential backoff from connection.ts) automatically.
 */
import { Worker } from 'bullmq';
import { bullConnection } from './connection';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import { emailService } from '../services/common/emailService';
import { webhookService } from '../services/notification/webhookService';

let started = false;
const workers: Worker[] = [];

export function startWorkers() {
  if (started) return;
  started = true;

  // ── Email worker ─────────────────────────────────────────────
  const emailWorker = new Worker(
    'email',
    async (job) => {
      const { to, subject, html } = job.data as { to: string; subject: string; html: string };
      await emailService.send(to, subject, html);   // throws → BullMQ retries
    },
    { connection: bullConnection, concurrency: 5 }
  );

  // ── Webhook worker ───────────────────────────────────────────
  const webhookWorker = new Worker(
    'webhook',
    async (job) => {
      const { webhookId, event, payload } = job.data as { webhookId: string; event: string; payload: any };
      const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
      if (!webhook || !webhook.isActive) return;          // deleted/disabled — nothing to do
      const result = await webhookService.deliver(webhook, event, payload);
      if (!result.ok) throw new Error(`webhook ${webhookId} returned ${result.statusCode}`); // → retry
    },
    { connection: bullConnection, concurrency: 5 }
  );

  workers.push(emailWorker, webhookWorker);

  for (const w of workers) {
    w.on('completed', (job) => logger.info(`[queues] ${w.name} job ${job.id} done`));
    w.on('failed', (job, err) =>
      logger.warn(`[queues] ${w.name} job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`)
    );
  }

  logger.info(`[queues] workers started: ${workers.map((w) => w.name).join(', ')}`);
}

export async function stopWorkers() {
  await Promise.all(workers.map((w) => w.close()));
}

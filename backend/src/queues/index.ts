/**
 * Queue definitions + producer helpers.
 *
 * Producers only ENQUEUE — they never import the services that do the work, so
 * there's no circular dependency (workers.ts imports the services). If Redis is
 * unavailable the enqueue is caught and logged; email/webhooks are best-effort
 * and must never take down the request that triggered them.
 */
import { Queue } from 'bullmq';
import { bullConnection, defaultJobOptions } from './connection';
import { logger } from '../utils/logger';

export const QUEUE_NAMES = ['email', 'webhook'] as const;

export const emailQueue   = new Queue('email',   { connection: bullConnection, defaultJobOptions });
export const webhookQueue = new Queue('webhook', { connection: bullConnection, defaultJobOptions });

export const allQueues = [emailQueue, webhookQueue];

// ── Producers ────────────────────────────────────────────────────────────────
export async function queueEmail(to: string, subject: string, html: string) {
  try {
    await emailQueue.add('send', { to, subject, html });
  } catch (err) {
    logger.error(`[queues] failed to enqueue email to ${to}: ${(err as Error).message}`);
  }
}

export async function queueWebhook(webhookId: string, event: string, payload: any) {
  try {
    await webhookQueue.add('deliver', { webhookId, event, payload });
  } catch (err) {
    logger.error(`[queues] failed to enqueue webhook ${webhookId}: ${(err as Error).message}`);
  }
}

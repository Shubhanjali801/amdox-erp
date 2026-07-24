/**
 * Shared ioredis connection for BullMQ.
 *
 * BullMQ requires an ioredis client (not node-redis, which the rest of the app
 * uses for caching/sessions) and mandates `maxRetriesPerRequest: null` so that
 * blocking commands used by workers don't get force-failed.
 */
import IORedis from 'ioredis';
import { logger } from '../utils/logger';

const url =
  process.env.REDIS_URL ||
  `redis://${process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : ''}${
    process.env.REDIS_HOST || 'localhost'
  }:${process.env.REDIS_PORT || '6379'}`;

export const bullConnection = new IORedis(url, {
  maxRetriesPerRequest: null,   // required by BullMQ
  enableReadyCheck: true,
});

bullConnection.on('connect', () => logger.info('[queues] BullMQ Redis connected'));
bullConnection.on('error', (err) => logger.error(`[queues] BullMQ Redis error: ${err.message}`));

// Sensible retry policy for every job unless a producer overrides it.
export const defaultJobOptions = {
  attempts: 3,                                   // matches spec F-10 "retry up to 3x"
  backoff: { type: 'exponential' as const, delay: 3000 },
  removeOnComplete: 200,                          // keep last 200 for the dashboard
  removeOnFail: 500,
};

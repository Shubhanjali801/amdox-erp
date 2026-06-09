import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';

// Outbound webhook delivery — M5
const QUEUE_NAME = 'webhook';

export const webhookJobQueue = new Queue(QUEUE_NAME, { connection: redisClient });

export const webhookJobWorker = new Worker(QUEUE_NAME, async (job: Job) => {
  console.log(`Processing job: ${job.id}`, job.data);
  // TODO: implement job logic
}, { connection: redisClient });

webhookJobWorker.on('completed', job  => console.log(`Done: ${job.id}`));
webhookJobWorker.on('failed',    (job, err) => console.error(`Failed: ${job?.id}`, err.message));

import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';

// Push/SMS notification dispatch — M5
const QUEUE_NAME = 'notification';

export const notificationJobQueue = new Queue(QUEUE_NAME, { connection: redisClient });

export const notificationJobWorker = new Worker(QUEUE_NAME, async (job: Job) => {
  console.log(`Processing job: ${job.id}`, job.data);
  // TODO: implement job logic
}, { connection: redisClient });

notificationJobWorker.on('completed', job  => console.log(`Done: ${job.id}`));
notificationJobWorker.on('failed',    (job, err) => console.error(`Failed: ${job?.id}`, err.message));

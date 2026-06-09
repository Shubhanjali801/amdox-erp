import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';

// Email delivery via AWS SES — M5
const QUEUE_NAME = 'email';

export const emailJobQueue = new Queue(QUEUE_NAME, { connection: redisClient });

export const emailJobWorker = new Worker(QUEUE_NAME, async (job: Job) => {
  console.log([] Processing job:, job.id, job.data);
  // TODO: implement job logic
}, { connection: redisClient });

emailJobWorker.on('completed', job  => console.log([] Done:, job.id));
emailJobWorker.on('failed',    (job, err) => console.error([] Failed:, job?.id, err.message));

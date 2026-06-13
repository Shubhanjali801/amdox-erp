import { Queue, Worker, Job } from 'bullmq';
import redisClient from '../config/redis';

// ML forecasting trigger — M5
const QUEUE_NAME = 'forecasting';

export const forecastingJobQueue = new Queue(QUEUE_NAME, { connection: redisClient });

export const forecastingJobWorker = new Worker(QUEUE_NAME, async (job: Job) => {
  console.log(`Processing job: ${job.id}`, job.data);
  // TODO: implement job logic
}, { connection: redisClient });

forecastingJobWorker.on('completed', job  => console.log(`Done: ${job.id}`));
forecastingJobWorker.on('failed',    (job, err) => console.error(`Failed: ${job?.id}`, err.message));

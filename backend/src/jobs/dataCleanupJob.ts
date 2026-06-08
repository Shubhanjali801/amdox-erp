import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';

// Stale data archival — M1
const QUEUE_NAME = 'dataCleanup';

export const dataCleanupJobQueue = new Queue(QUEUE_NAME, { connection: redisClient });

export const dataCleanupJobWorker = new Worker(QUEUE_NAME, async (job: Job) => {
  console.log([] Processing job:, job.id, job.data);
  // TODO: implement job logic
}, { connection: redisClient });

dataCleanupJobWorker.on('completed', job  => console.log([] Done:, job.id));
dataCleanupJobWorker.on('failed',    (job, err) => console.error([] Failed:, job?.id, err.message));

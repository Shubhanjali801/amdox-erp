import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';

// Scheduled report generation — M6
const QUEUE_NAME = 'reportGeneration';

export const reportGenerationJobQueue = new Queue(QUEUE_NAME, { connection: redisClient });

export const reportGenerationJobWorker = new Worker(QUEUE_NAME, async (job: Job) => {
  console.log(`Processing job: ${job.id}`, job.data);
  // TODO: implement job logic
}, { connection: redisClient });

reportGenerationJobWorker.on('completed', job  => console.log(`Done: ${job.id}`));
reportGenerationJobWorker.on('failed',    (job, err) => console.error(`Failed: ${job?.id}`, err.message));

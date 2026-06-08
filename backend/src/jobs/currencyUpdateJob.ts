import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';

// Daily FX rate sync — M3
const QUEUE_NAME = 'currencyUpdate';

export const currencyUpdateJobQueue = new Queue(QUEUE_NAME, { connection: redisClient });

export const currencyUpdateJobWorker = new Worker(QUEUE_NAME, async (job: Job) => {
  console.log([] Processing job:, job.id, job.data);
  // TODO: implement job logic
}, { connection: redisClient });

currencyUpdateJobWorker.on('completed', job  => console.log([] Done:, job.id));
currencyUpdateJobWorker.on('failed',    (job, err) => console.error([] Failed:, job?.id, err.message));

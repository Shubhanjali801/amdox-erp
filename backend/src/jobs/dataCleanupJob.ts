import { Job, Queue, Worker } from 'bullmq';

const QUEUE_NAME = 'data-cleanup';
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const dataCleanupJobQueue = new Queue(QUEUE_NAME, { connection });

export const dataCleanupJobWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    console.log('Processing data cleanup job:', job.id, job.data);
  },
  { connection }
);

dataCleanupJobWorker.on('completed', job => console.log('Data cleanup job done:', job.id));
dataCleanupJobWorker.on('failed', (job, err) => console.error('Data cleanup job failed:', job?.id, err.message));

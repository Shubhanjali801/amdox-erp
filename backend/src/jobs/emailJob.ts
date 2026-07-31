import { Job, Queue, Worker } from 'bullmq';

const QUEUE_NAME = 'email';
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const emailJobQueue = new Queue(QUEUE_NAME, { connection });

export const emailJobWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    console.log('Processing email job:', job.id, job.data);
  },
  { connection }
);

emailJobWorker.on('completed', job => console.log('Email job done:', job.id));
emailJobWorker.on('failed', (job, err) => console.error('Email job failed:', job?.id, err.message));

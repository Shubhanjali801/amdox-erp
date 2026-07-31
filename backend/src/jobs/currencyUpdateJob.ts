import { Job, Queue, Worker } from 'bullmq';

const QUEUE_NAME = 'currency-update';
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const currencyUpdateJobQueue = new Queue(QUEUE_NAME, { connection });

export const currencyUpdateJobWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    console.log('Processing currency update job:', job.id, job.data);
  },
  { connection }
);

currencyUpdateJobWorker.on('completed', job => console.log('Currency update job done:', job.id));
currencyUpdateJobWorker.on('failed', (job, err) => console.error('Currency update job failed:', job?.id, err.message));

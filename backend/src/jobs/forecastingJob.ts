import { Job, Queue, Worker } from 'bullmq';

const QUEUE_NAME = 'forecasting';
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const forecastingJobQueue = new Queue(QUEUE_NAME, { connection });

export const forecastingJobWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    console.log('Processing forecasting job:', job.id, job.data);
  },
  { connection }
);

forecastingJobWorker.on('completed', job => console.log('Forecasting job done:', job.id));
forecastingJobWorker.on('failed', (job, err) => console.error('Forecasting job failed:', job?.id, err.message));

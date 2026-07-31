import { Job, Queue, Worker } from 'bullmq';

const QUEUE_NAME = 'report-generation';
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const reportGenerationJobQueue = new Queue(QUEUE_NAME, { connection });

export const reportGenerationJobWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    console.log('Processing report generation job:', job.id, job.data);
  },
  { connection }
);

reportGenerationJobWorker.on('completed', job => console.log('Report generation job done:', job.id));
reportGenerationJobWorker.on('failed', (job, err) => console.error('Report generation job failed:', job?.id, err.message));

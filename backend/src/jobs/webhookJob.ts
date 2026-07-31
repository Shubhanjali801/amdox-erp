import { Job, Queue, Worker } from 'bullmq';

const QUEUE_NAME = 'webhook';
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const webhookJobQueue = new Queue(QUEUE_NAME, { connection });

export const webhookJobWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    console.log('Processing webhook job:', job.id, job.data);
  },
  { connection }
);

webhookJobWorker.on('completed', job => console.log('Webhook job done:', job.id));
webhookJobWorker.on('failed', (job, err) => console.error('Webhook job failed:', job?.id, err.message));

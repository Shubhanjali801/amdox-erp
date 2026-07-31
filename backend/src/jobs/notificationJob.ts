import { Job, Queue, Worker } from 'bullmq';

const QUEUE_NAME = 'notification';
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const notificationJobQueue = new Queue(QUEUE_NAME, { connection });

export const notificationJobWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    console.log('Processing notification job:', job.id, job.data);
  },
  { connection }
);

notificationJobWorker.on('completed', job => console.log('Notification job done:', job.id));
notificationJobWorker.on('failed', (job, err) => console.error('Notification job failed:', job?.id, err.message));

import { Job, Queue, Worker } from 'bullmq';

const QUEUE_NAME = 'payroll';
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const payrollJobQueue = new Queue(QUEUE_NAME, { connection });

export const payrollJobWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    console.log('Processing payroll job:', job.id, job.data);
  },
  { connection }
);

payrollJobWorker.on('completed', job => console.log('Payroll job done:', job.id));
payrollJobWorker.on('failed', (job, err) => console.error('Payroll job failed:', job?.id, err.message));

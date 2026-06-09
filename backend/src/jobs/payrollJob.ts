import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';

// Payroll batch processing — M4
const QUEUE_NAME = 'payroll';

export const payrollJobQueue = new Queue(QUEUE_NAME, { connection: redisClient });

export const payrollJobWorker = new Worker(QUEUE_NAME, async (job: Job) => {
  console.log(`Processing job: ${job.id}`, job.data);
  // TODO: implement job logic
}, { connection: redisClient });

payrollJobWorker.on('completed', job  => console.log(`Done: ${job.id}`));
payrollJobWorker.on('failed',    (job, err) => console.error(`Failed: ${job?.id}`, err.message));

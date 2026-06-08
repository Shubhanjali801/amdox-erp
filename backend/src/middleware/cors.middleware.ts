import cors from 'cors';
import { ENV } from '../config/env';

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  ...(ENV.CORS_ORIGINS ? ENV.CORS_ORIGINS.split(',') : []),
];

export const corsMiddleware = cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Tenant-Id'],
});

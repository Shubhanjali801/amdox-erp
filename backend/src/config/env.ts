import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  // ── App ──────────────────────────────────────────────
  NODE_ENV:    process.env.NODE_ENV    || 'development',
  PORT:        parseInt(process.env.PORT || '5000'),
  CLIENT_URL:  process.env.CLIENT_URL  || 'http://localhost:3000',
  CORS_ORIGINS:process.env.CORS_ORIGINS || 'http://localhost:3000',

  // ── Database (PostgreSQL 18 + Prisma) ────────────────
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:goopostgresql866@localhost:5432/amdox_erp',

  // ── Redis ─────────────────────────────────────────────
  REDIS_HOST:     process.env.REDIS_HOST     || 'localhost',
  REDIS_PORT:     parseInt(process.env.REDIS_PORT || '6379'),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD  || '',

  // ── JWT ───────────────────────────────────────────────
  JWT_SECRET:            process.env.JWT_SECRET            || 'dev_jwt_secret_change_in_production',
  JWT_EXPIRES_IN:        process.env.JWT_EXPIRES_IN        || '15m',
  JWT_REFRESH_SECRET:    process.env.JWT_REFRESH_SECRET    || 'dev_refresh_secret_change_in_production',
  JWT_REFRESH_EXPIRES_IN:process.env.JWT_REFRESH_EXPIRES_IN|| '7d',

  // ── Keycloak ──────────────────────────────────────────
  KEYCLOAK_URL:       process.env.KEYCLOAK_URL       || 'http://localhost:8080',
  KEYCLOAK_REALM:     process.env.KEYCLOAK_REALM     || 'amdox-erp',
  KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID || 'amdox-backend',
  KEYCLOAK_SECRET:    process.env.KEYCLOAK_SECRET    || '',

  // ── AWS ───────────────────────────────────────────────
  AWS_REGION:           process.env.AWS_REGION           || 'ap-south-1',
  AWS_ACCESS_KEY_ID:    process.env.AWS_ACCESS_KEY_ID    || '',
  AWS_SECRET_ACCESS_KEY:process.env.AWS_SECRET_ACCESS_KEY|| '',
  AWS_S3_BUCKET:        process.env.AWS_S3_BUCKET        || 'amdox-erp-files',
  AWS_SES_FROM_EMAIL:   process.env.AWS_SES_FROM_EMAIL   || 'noreply@amdox.com',

  // ── Email ─────────────────────────────────────────────
  EMAIL_FROM:    process.env.EMAIL_FROM    || 'Amdox ERP <noreply@amdox.com>',
  EMAIL_REPLY_TO:process.env.EMAIL_REPLY_TO|| 'support@amdox.com',
  SMTP_HOST:     process.env.SMTP_HOST     || 'smtp.gmail.com',
  SMTP_PORT:     parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER:     process.env.SMTP_USER     || '',
  SMTP_PASS:     process.env.SMTP_PASS     || '',

  // ── ML Microservice ───────────────────────────────────
  ML_SERVICE_URL:    process.env.ML_SERVICE_URL    || 'http://localhost:8000',
  ML_SERVICE_API_KEY:process.env.ML_SERVICE_API_KEY|| '',

  // ── Elasticsearch ─────────────────────────────────────
  ELASTICSEARCH_URL:          process.env.ELASTICSEARCH_URL           || 'http://localhost:9200',
  ELASTICSEARCH_INDEX_PREFIX: process.env.ELASTICSEARCH_INDEX_PREFIX  || 'amdox_',

  // ── Twilio (SMS) ──────────────────────────────────────
  TWILIO_ACCOUNT_SID:  process.env.TWILIO_ACCOUNT_SID  || '',
  TWILIO_AUTH_TOKEN:   process.env.TWILIO_AUTH_TOKEN   || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',

  // ── Helpers ───────────────────────────────────────────
  isProduction:  process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest:        process.env.NODE_ENV === 'test',
} as const;

// Alias for backwards compatibility
export const env = ENV;

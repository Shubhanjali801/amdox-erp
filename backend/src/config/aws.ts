import { ENV } from './env';
export const awsConfig = {
  region:          ENV.AWS_REGION          || 'us-east-1',
  accessKeyId:     ENV.AWS_ACCESS_KEY_ID   || '',
  secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY || '',
  s3Bucket:        ENV.AWS_S3_BUCKET       || 'amdox-erp-files',
  sesFromEmail:    ENV.AWS_SES_FROM_EMAIL  || 'noreply@amdox.com',
};

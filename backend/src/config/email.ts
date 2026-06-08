import { ENV } from './env';
export const emailConfig = {
  provider: ENV.EMAIL_PROVIDER || 'ses',
  from:     ENV.EMAIL_FROM     || 'Amdox ERP <noreply@amdox.com>',
  replyTo:  ENV.EMAIL_REPLY_TO || 'support@amdox.com',
};

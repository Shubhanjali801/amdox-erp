import crypto from 'crypto';
export const encrypt = (text: string, key: string) => { const iv = crypto.randomBytes(16); const c = crypto.createCipheriv('aes-256-gcm', Buffer.from(key,'hex'), iv); return iv.toString('hex') + c.update(text,'utf8','hex') + c.final('hex'); };

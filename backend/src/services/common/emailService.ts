/**
 * Email Service — Gmail SMTP via Nodemailer.
 * Requires env: GMAIL_USER, GMAIL_APP_PASSWORD (a 16-char Google App Password),
 * and FRONTEND_URL (for building links). If creds are missing, falls back to
 * logging the email so dev still works.
 */
import nodemailer from 'nodemailer';
import { logger } from '../../utils/logger';
import { queueEmail } from '../../queues';

const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';
const FROM_NAME = process.env.MAIL_FROM_NAME || 'Amdox ERP';

let transporter: nodemailer.Transporter | null = null;
if (GMAIL_USER && GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
}

export const emailService = {
  async send(to: string, subject: string, html: string): Promise<void> {
    if (!transporter) {
      logger.warn(`[email] GMAIL creds not set — would send to ${to}: ${subject}`);
      logger.info(`[email-preview] ${html.replace(/<[^>]+>/g, ' ').trim()}`);
      return;
    }
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${GMAIL_USER}>`,
      to, subject, html,
    });
    logger.info(`[email] sent to ${to}: ${subject}`);
  },

  async sendPasswordReset(to: string, resetLink: string, firstName?: string): Promise<void> {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#2563eb">Amdox ERP — Password Reset</h2>
        <p>Hi ${firstName || 'there'},</p>
        <p>We received a request to reset your password. Click the button below to set a new one.
           This link expires in <b>15 minutes</b>.</p>
        <p style="text-align:center;margin:28px 0">
          <a href="${resetLink}" style="background:#2563eb;color:#fff;padding:12px 24px;
             border-radius:8px;text-decoration:none;font-weight:bold">Reset Password</a>
        </p>
        <p style="color:#6b7280;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        <p style="color:#9ca3af;font-size:12px">Or paste this link: <br>${resetLink}</p>
      </div>`;
    // Enqueue instead of sending inline — the email worker delivers it with
    // automatic retries, and the request returns immediately.
    await queueEmail(to, 'Reset your Amdox ERP password', html);
  },
};

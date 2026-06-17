/**
 * Notification Service — M5 / F-10
 * In-app notifications per user. notify() is the reusable entry point
 * other modules call to push a notification (respecting preferences).
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

export interface NotifyInput {
  tenantId:    string;
  userId:      string;
  title:       string;
  message:     string;
  type?:       'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  channel?:    'IN_APP' | 'EMAIL' | 'SMS' | 'WEBHOOK';
  event?:      string;
  resourceId?: string;
}

export interface NotifListParams { tenantId: string; userId: string; isRead?: boolean; type?: string; page?: number; limit?: number; }

export const notificationService = {
  // ── Reusable: create a notification for a user ───────────
  async notify(input: NotifyInput) {
    const n = await prisma.notification.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: (input.type as any) || 'INFO',
        channel: (input.channel as any) || 'IN_APP',
        event: input.event || 'system.generic',
        resourceId: input.resourceId,
        deliveredAt: new Date(),
      },
    });
    logger.info(`Notification → user ${input.userId}: ${input.title}`);
    return n;
  },

  async list(p: NotifListParams) {
    const page = Math.max(1, p.page || 1);
    const limit = Math.min(100, p.limit || 20);
    const where: any = { tenantId: p.tenantId, userId: p.userId };
    if (p.isRead !== undefined) where.isRead = p.isRead;
    if (p.type) where.type = p.type;
    const [data, total] = await Promise.all([
      prisma.notification.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
    ]);
    return { data, total, page, limit };
  },

  async unreadCount(tenantId: string, userId: string) {
    const count = await prisma.notification.count({ where: { tenantId, userId, isRead: false } });
    return { unread: count };
  },

  async getById(tenantId: string, userId: string, id: string) {
    const n = await prisma.notification.findFirst({ where: { id, tenantId, userId } });
    if (!n) throw new Error('NOTIFICATION_NOT_FOUND');
    return n;
  },

  async markRead(tenantId: string, userId: string, id: string) {
    await this.getById(tenantId, userId, id);
    return prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
  },

  async markAllRead(tenantId: string, userId: string) {
    const r = await prisma.notification.updateMany({
      where: { tenantId, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: r.count };
  },

  async remove(tenantId: string, userId: string, id: string) {
    await this.getById(tenantId, userId, id);
    await prisma.notification.delete({ where: { id } });
    logger.info(`Notification deleted: ${id}`);
  },
};

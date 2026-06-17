import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../../services/notification/notificationService';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;
const userOf   = (req: Request) => (req as any).user?.userId || (req as any).user?.id;

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isRead, type, page, limit } = req.query;
    const r = await notificationService.list({
      tenantId: tenantOf(req), userId: userOf(req),
      isRead: isRead === undefined ? undefined : isRead === 'true',
      type: type as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    return sendPaginated(res, r.data, r.total, r.page, r.limit);
  } catch (err) { next(err); }
};

export const unreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await notificationService.unreadCount(tenantOf(req), userOf(req));
    return sendSuccess(res, r, 'Unread count');
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const n = await notificationService.getById(tenantOf(req), userOf(req), req.params.id as string);
    return sendSuccess(res, n, 'Notification fetched');
  } catch (err: any) {
    if (err.message === 'NOTIFICATION_NOT_FOUND') return sendError(res, 'Notification not found', 404);
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const n = await notificationService.notify({
      tenantId: tenantOf(req),
      userId: req.body.userId || userOf(req),
      title: req.body.title, message: req.body.message,
      type: req.body.type, channel: req.body.channel,
      event: req.body.event, resourceId: req.body.resourceId,
    });
    return sendSuccess(res, n, 'Notification created', 201);
  } catch (err) { next(err); }
};

// PUT /:id → mark as read
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const n = await notificationService.markRead(tenantOf(req), userOf(req), req.params.id as string);
    return sendSuccess(res, n, 'Notification marked read');
  } catch (err: any) {
    if (err.message === 'NOTIFICATION_NOT_FOUND') return sendError(res, 'Notification not found', 404);
    next(err);
  }
};

export const markAllRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await notificationService.markAllRead(tenantOf(req), userOf(req));
    return sendSuccess(res, r, 'All notifications marked read');
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.remove(tenantOf(req), userOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Notification deleted');
  } catch (err: any) {
    if (err.message === 'NOTIFICATION_NOT_FOUND') return sendError(res, 'Notification not found', 404);
    next(err);
  }
};

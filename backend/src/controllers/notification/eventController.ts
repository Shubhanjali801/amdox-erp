import { Request, Response, NextFunction } from 'express';
import { eventService } from '../../services/notification/eventService';
import { sendSuccess, sendError } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;
const userOf   = (req: Request) => (req as any).user?.userId || (req as any).user?.id;

// GET /events — catalog of supported domain events
export const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, eventService.catalog(), 'Event catalog');
  } catch (err) { next(err); }
};

// GET /events/:id — one event definition (id = event name)
export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const e = eventService.getByName(req.params.id as string);
    return sendSuccess(res, e, 'Event fetched');
  } catch (err: any) {
    if (err.message === 'EVENT_NOT_FOUND') return sendError(res, 'Unknown event', 404);
    next(err);
  }
};

// POST /events → emit an event (notify user + dispatch webhooks)
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await eventService.emit(tenantOf(req), {
      event: req.body.event,
      userId: req.body.userId || userOf(req),
      title: req.body.title, message: req.body.message,
      type: req.body.type, resourceId: req.body.resourceId,
    });
    return sendSuccess(res, r, `Event '${r.event}' emitted (${r.webhooks.dispatched} webhook(s))`, 201);
  } catch (err) { next(err); }
};

export const update = async (_req: Request, res: Response) =>
  sendError(res, 'Events are immutable — emit a new one with POST /events', 405);

export const remove = async (_req: Request, res: Response) =>
  sendError(res, 'Events cannot be deleted', 405);

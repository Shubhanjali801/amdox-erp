import { Router } from 'express';
import * as ctrl from '../../controllers/notification/notificationController';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createNotificationSchema } from '../../validators/notification.validator';

const r = Router();
r.use(authenticate);

// Per-user — every authenticated user manages their own notifications.
// Specific paths BEFORE '/:id' so they aren't swallowed.
r.get('/unread/count', ctrl.unreadCount);
r.post('/read-all',    ctrl.markAllRead);
r.get('/',             ctrl.getAll);
r.get('/:id',          ctrl.getById);
r.post('/',            validate(createNotificationSchema), ctrl.create);
r.put('/:id',          ctrl.update);   // mark read
r.delete('/:id',       ctrl.remove);

export default r;

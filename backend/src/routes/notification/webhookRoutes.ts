import { Router } from 'express';
import * as ctrl from '../../controllers/notification/webhookController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createWebhookSchema, updateWebhookSchema } from '../../validators/notification.validator';

const r = Router();
r.use(authenticate);

// Webhooks are tenant-level integration config → admin (users:write)
r.get('/',         requirePermission('user:read'),  ctrl.getAll);
r.get('/:id',      requirePermission('user:read'),  ctrl.getById);
r.post('/',        requirePermission('user:create'), validate(createWebhookSchema), ctrl.create);
r.put('/:id',      requirePermission('user:create'), validate(updateWebhookSchema), ctrl.update);
r.delete('/:id',   requirePermission('user:create'), ctrl.remove);
r.post('/:id/test', requirePermission('user:create'), ctrl.test);

export default r;

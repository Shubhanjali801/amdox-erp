import { Router } from 'express';
import * as ctrl from '../../controllers/settings/integrationController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { upsertIntegrationSchema } from '../../validators/settings.validator';

const r = Router();
r.use(authenticate);

// :id = integration key (e.g. slack, stripe, quickbooks)
r.get('/',       requirePermission('users:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('users:read'),  ctrl.getById);
r.put('/:id',    requirePermission('users:write'), validate(upsertIntegrationSchema), ctrl.update);
r.delete('/:id', requirePermission('users:write'), ctrl.remove);

export default r;

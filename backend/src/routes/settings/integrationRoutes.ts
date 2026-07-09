import { Router } from 'express';
import * as ctrl from '../../controllers/settings/integrationController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { upsertIntegrationSchema } from '../../validators/settings.validator';

const r = Router();
r.use(authenticate);

// :id = integration key (e.g. slack, stripe, quickbooks)
r.get('/',       requirePermission('user:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('user:read'),  ctrl.getById);
r.put('/:id',    requirePermission('user:create'), validate(upsertIntegrationSchema), ctrl.update);
r.delete('/:id', requirePermission('user:create'), ctrl.remove);

export default r;

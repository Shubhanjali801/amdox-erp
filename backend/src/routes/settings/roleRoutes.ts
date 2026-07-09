import { Router } from 'express';
import * as ctrl from '../../controllers/settings/roleController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createRoleSchema, updateRoleSchema, assignRoleSchema } from '../../validators/settings.validator';

const r = Router();
r.use(authenticate);

r.get('/',       requirePermission('user:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('user:read'),  ctrl.getById);
r.post('/',      requirePermission('user:create'), validate(createRoleSchema), ctrl.create);
r.put('/:id',    requirePermission('user:create'), validate(updateRoleSchema), ctrl.update);
r.delete('/:id', requirePermission('user:create'), ctrl.remove);

// Assign / revoke a role to a user
r.post('/:id/assign', requirePermission('user:create'), validate(assignRoleSchema), ctrl.assign);
r.post('/:id/revoke', requirePermission('user:create'), validate(assignRoleSchema), ctrl.revoke);

export default r;

import { Router } from 'express';
import * as ctrl from '../../controllers/settings/roleController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createRoleSchema, updateRoleSchema, assignRoleSchema } from '../../validators/settings.validator';

const r = Router();
r.use(authenticate);

r.get('/',       requirePermission('users:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('users:read'),  ctrl.getById);
r.post('/',      requirePermission('users:write'), validate(createRoleSchema), ctrl.create);
r.put('/:id',    requirePermission('users:write'), validate(updateRoleSchema), ctrl.update);
r.delete('/:id', requirePermission('users:write'), ctrl.remove);

// Assign / revoke a role to a user
r.post('/:id/assign', requirePermission('users:write'), validate(assignRoleSchema), ctrl.assign);
r.post('/:id/revoke', requirePermission('users:write'), validate(assignRoleSchema), ctrl.revoke);

export default r;

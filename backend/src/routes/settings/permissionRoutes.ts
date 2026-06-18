import { Router } from 'express';
import * as ctrl from '../../controllers/settings/permissionController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createPermissionSchema } from '../../validators/settings.validator';

const r = Router();
r.use(authenticate);

r.get('/',       requirePermission('users:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('users:read'),  ctrl.getById);
r.post('/',      requirePermission('users:write'), validate(createPermissionSchema), ctrl.create);
r.put('/:id',    requirePermission('users:write'), ctrl.update);   // 405 (immutable)
r.delete('/:id', requirePermission('users:write'), ctrl.remove);

export default r;

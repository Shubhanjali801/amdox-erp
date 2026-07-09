import { Router } from 'express';
import * as ctrl from '../../controllers/settings/permissionController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createPermissionSchema } from '../../validators/settings.validator';

const r = Router();
r.use(authenticate);

r.get('/',       requirePermission('user:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('user:read'),  ctrl.getById);
r.post('/',      requirePermission('user:create'), validate(createPermissionSchema), ctrl.create);
r.put('/:id',    requirePermission('user:create'), ctrl.update);   // 405 (immutable)
r.delete('/:id', requirePermission('user:create'), ctrl.remove);

export default r;

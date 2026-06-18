import { Router } from 'express';
import * as ctrl from '../../controllers/project/resourceController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createResourceSchema, updateResourceSchema } from '../../validators/project.validator';

const r = Router();
r.use(authenticate);

r.get('/',       requirePermission('projects:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('projects:read'),  ctrl.getById);
r.post('/',      requirePermission('projects:write'), validate(createResourceSchema), ctrl.create);
r.put('/:id',    requirePermission('projects:write'), validate(updateResourceSchema), ctrl.update);
r.delete('/:id', requirePermission('projects:write'), ctrl.remove);

export default r;

import { Router } from 'express';
import * as ctrl from '../../controllers/project/taskController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createTaskSchema, updateTaskSchema } from '../../validators/project.validator';

const r = Router();
r.use(authenticate);

r.get('/',       requirePermission('project:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('project:read'),  ctrl.getById);
r.post('/',      requirePermission('project:create'), validate(createTaskSchema), ctrl.create);
r.put('/:id',    requirePermission('project:create'), validate(updateTaskSchema), ctrl.update);
r.delete('/:id', requirePermission('project:create'), ctrl.remove);

export default r;

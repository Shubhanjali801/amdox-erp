import { Router } from 'express';
import * as ctrl from '../../controllers/hr/organisationController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createDeptSchema, updateDeptSchema } from '../../validators/hr.validator';

const r = Router();

r.use(authenticate);

r.get('/',       requirePermission('hr:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('hr:read'),  ctrl.getById);
r.post('/',      requirePermission('hr:write'), validate(createDeptSchema), ctrl.create);
r.put('/:id',    requirePermission('hr:write'), validate(updateDeptSchema), ctrl.update);
r.delete('/:id', requirePermission('hr:write'), ctrl.remove);

export default r;

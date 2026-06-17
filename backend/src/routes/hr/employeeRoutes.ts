import { Router } from 'express';
import * as ctrl from '../../controllers/hr/employeeController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createEmployeeSchema, updateEmployeeSchema } from '../../validators/hr.validator';

const r = Router();

r.use(authenticate);

r.get('/',       requirePermission('hr:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('hr:read'),  ctrl.getById);
r.post('/',      requirePermission('hr:write'), validate(createEmployeeSchema), ctrl.create);
r.put('/:id',    requirePermission('hr:write'), validate(updateEmployeeSchema), ctrl.update);
r.delete('/:id', requirePermission('hr:write'), ctrl.remove);

export default r;

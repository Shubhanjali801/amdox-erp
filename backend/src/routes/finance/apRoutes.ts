import { Router } from 'express';
import * as ctrl from '../../controllers/finance/apController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createApSchema, updateApSchema } from '../../validators/finance.validator';

const r = Router();

r.use(authenticate);

r.get('/',             requirePermission('finance:read'),    ctrl.getAll);
r.get('/:id',          requirePermission('finance:read'),    ctrl.getById);
r.post('/',            requirePermission('finance:write'),   validate(createApSchema), ctrl.create);
r.post('/:id/approve', requirePermission('finance:approve'), ctrl.approve);
r.put('/:id',          requirePermission('finance:write'),   validate(updateApSchema), ctrl.update);
r.delete('/:id',       requirePermission('finance:write'),   ctrl.remove);

export default r;

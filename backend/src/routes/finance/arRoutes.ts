import { Router } from 'express';
import * as ctrl from '../../controllers/finance/arController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createArSchema, updateArSchema } from '../../validators/finance.validator';

const r = Router();

r.use(authenticate);

r.get('/',             requirePermission('finance:read'),    ctrl.getAll);
r.get('/:id',          requirePermission('finance:read'),    ctrl.getById);
r.post('/',            requirePermission('finance:write'),   validate(createArSchema), ctrl.create);
r.post('/:id/approve', requirePermission('finance:approve'), ctrl.approve);
r.put('/:id',          requirePermission('finance:write'),   validate(updateArSchema), ctrl.update);
r.delete('/:id',       requirePermission('finance:write'),   ctrl.remove);

export default r;

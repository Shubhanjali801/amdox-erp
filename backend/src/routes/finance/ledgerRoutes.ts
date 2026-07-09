import { Router } from 'express';
import * as ctrl from '../../controllers/finance/ledgerController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createAccountSchema, updateAccountSchema } from '../../validators/finance.validator';

const r = Router();

r.use(authenticate);

r.get('/',       requirePermission('finance:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('finance:read'),  ctrl.getById);
r.post('/',      requirePermission('finance:create'), validate(createAccountSchema), ctrl.create);
r.put('/:id',    requirePermission('finance:create'), validate(updateAccountSchema), ctrl.update);
r.delete('/:id', requirePermission('finance:create'), ctrl.remove);

export default r;

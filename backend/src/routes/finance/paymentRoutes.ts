import { Router } from 'express';
import * as ctrl from '../../controllers/finance/paymentController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createPaymentSchema } from '../../validators/finance.validator';

const r = Router();

r.use(authenticate);

r.get('/',       requirePermission('finance:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('finance:read'),  ctrl.getById);
r.post('/',      requirePermission('finance:create'), validate(createPaymentSchema), ctrl.create);
r.delete('/:id', requirePermission('finance:create'), ctrl.remove);

export default r;

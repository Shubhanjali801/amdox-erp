import { Router } from 'express';
import * as ctrl from '../../controllers/supplyChain/poController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createPOSchema, receivePOSchema } from '../../validators/supplyChain.validator';

const r = Router();
r.use(authenticate);

r.get('/',       requirePermission('supply:read'),    ctrl.getAll);
r.get('/:id',    requirePermission('supply:read'),    ctrl.getById);
r.post('/',      requirePermission('supply:write'),   validate(createPOSchema), ctrl.create);
r.put('/:id',    requirePermission('supply:approve'), ctrl.update);   // DRAFT → SENT
r.delete('/:id', requirePermission('supply:write'),   ctrl.remove);   // cancel

// Receive goods against a PO → GRN + stock IN
r.post('/:id/receive', requirePermission('supply:write'), validate(receivePOSchema), ctrl.receive);

export default r;

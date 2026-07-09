import { Router } from 'express';
import * as ctrl from '../../controllers/supplyChain/poController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createPOSchema, receivePOSchema } from '../../validators/supplyChain.validator';

const r = Router();
r.use(authenticate);

r.get('/',       requirePermission('supply_chain:read'),    ctrl.getAll);
r.get('/:id',    requirePermission('supply_chain:read'),    ctrl.getById);
r.post('/',      requirePermission('supply_chain:create'),   validate(createPOSchema), ctrl.create);
r.put('/:id',    requirePermission('supply_chain:approve'), ctrl.update);   // DRAFT → SENT
r.delete('/:id', requirePermission('supply_chain:create'),   ctrl.remove);   // cancel

// Receive goods against a PO → GRN + stock IN
r.post('/:id/receive', requirePermission('supply_chain:create'), validate(receivePOSchema), ctrl.receive);

export default r;

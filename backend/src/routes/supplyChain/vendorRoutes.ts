import { Router } from 'express';
import * as ctrl from '../../controllers/supplyChain/vendorController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createVendorSchema, updateVendorSchema } from '../../validators/supplyChain.validator';

const r = Router();
r.use(authenticate);

r.get('/',       requirePermission('supply_chain:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('supply_chain:read'),  ctrl.getById);
r.post('/',      requirePermission('supply_chain:create'), validate(createVendorSchema), ctrl.create);
r.put('/:id',    requirePermission('supply_chain:create'), validate(updateVendorSchema), ctrl.update);
r.delete('/:id', requirePermission('supply_chain:create'), ctrl.remove);

export default r;

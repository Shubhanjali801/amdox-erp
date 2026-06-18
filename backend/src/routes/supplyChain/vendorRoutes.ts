import { Router } from 'express';
import * as ctrl from '../../controllers/supplyChain/vendorController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createVendorSchema, updateVendorSchema } from '../../validators/supplyChain.validator';

const r = Router();
r.use(authenticate);

r.get('/',       requirePermission('supply:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('supply:read'),  ctrl.getById);
r.post('/',      requirePermission('supply:write'), validate(createVendorSchema), ctrl.create);
r.put('/:id',    requirePermission('supply:write'), validate(updateVendorSchema), ctrl.update);
r.delete('/:id', requirePermission('supply:write'), ctrl.remove);

export default r;

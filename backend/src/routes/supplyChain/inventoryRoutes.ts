import { Router } from 'express';
import * as ctrl from '../../controllers/supplyChain/inventoryController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createItemSchema, updateItemSchema, stockMovementSchema } from '../../validators/supplyChain.validator';

const r = Router();
r.use(authenticate);

r.get('/',       requirePermission('supply:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('supply:read'),  ctrl.getById);
r.post('/',      requirePermission('supply:write'), validate(createItemSchema), ctrl.create);
r.put('/:id',    requirePermission('supply:write'), validate(updateItemSchema), ctrl.update);
r.delete('/:id', requirePermission('supply:write'), ctrl.remove);

// Stock movements (IN / OUT / ADJUSTMENT) — keeps quantityOnHand in sync
r.get('/:id/movements',  requirePermission('supply:read'),  ctrl.listMovements);
r.post('/:id/movements', requirePermission('supply:write'), validate(stockMovementSchema), ctrl.addMovement);

export default r;

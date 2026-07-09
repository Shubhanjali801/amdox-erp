import { Router } from 'express';
import * as ctrl from '../../controllers/supplyChain/inventoryController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createItemSchema, updateItemSchema, stockMovementSchema } from '../../validators/supplyChain.validator';

const r = Router();
r.use(authenticate);

r.get('/',       requirePermission('supply_chain:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('supply_chain:read'),  ctrl.getById);
r.post('/',      requirePermission('supply_chain:create'), validate(createItemSchema), ctrl.create);
r.put('/:id',    requirePermission('supply_chain:create'), validate(updateItemSchema), ctrl.update);
r.delete('/:id', requirePermission('supply_chain:create'), ctrl.remove);

// Stock movements (IN / OUT / ADJUSTMENT) — keeps quantityOnHand in sync
r.get('/:id/movements',  requirePermission('supply_chain:read'),  ctrl.listMovements);
r.post('/:id/movements', requirePermission('supply_chain:create'), validate(stockMovementSchema), ctrl.addMovement);

export default r;

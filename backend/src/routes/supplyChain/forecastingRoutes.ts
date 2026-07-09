import { Router } from 'express';
import * as ctrl from '../../controllers/supplyChain/forecastingController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';

const r = Router();

r.use(authenticate);

// Health check for the ML microservice
r.get('/health/ml', ctrl.mlHealth);

r.get('/',       requirePermission('supply_chain:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('supply_chain:read'),  ctrl.getById);
r.post('/',      requirePermission('supply_chain:create'), ctrl.create);   // generate forecast (calls ML)
r.put('/:id',    requirePermission('supply_chain:create'), ctrl.update);
r.delete('/:id', requirePermission('supply_chain:create'), ctrl.remove);

export default r;

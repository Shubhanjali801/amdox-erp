import { Router } from 'express';
import * as ctrl from '../../controllers/finance/currencyController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';

const r = Router();

r.use(authenticate);

// /convert must come before /:id so it isn't matched as an id
r.get('/convert', requirePermission('finance:read'),  ctrl.convert);
r.get('/',        requirePermission('finance:read'),  ctrl.getAll);
r.get('/:id',     requirePermission('finance:read'),  ctrl.getById);
r.post('/',       requirePermission('finance:create'), ctrl.create);
r.put('/:id',     requirePermission('finance:create'), ctrl.update);
r.delete('/:id',  requirePermission('finance:create'), ctrl.remove);

export default r;

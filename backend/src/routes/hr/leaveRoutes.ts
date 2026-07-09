import { Router } from 'express';
import * as ctrl from '../../controllers/hr/leaveController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';

const r = Router();
r.use(authenticate);

// Leave types
r.get('/types',  requirePermission('hr:read'),  ctrl.listTypes);
r.post('/types', requirePermission('hr:create'), ctrl.createType);

// Leave requests
r.get('/',            requirePermission('hr:read'),    ctrl.getAll);
r.get('/:id',         requirePermission('hr:read'),    ctrl.getById);
r.post('/',           requirePermission('hr:create'),   ctrl.create);
r.post('/:id/approve',requirePermission('hr:approve'), ctrl.approve);
r.post('/:id/reject', requirePermission('hr:approve'), ctrl.reject);
r.delete('/:id',      requirePermission('hr:create'),   ctrl.remove);

export default r;

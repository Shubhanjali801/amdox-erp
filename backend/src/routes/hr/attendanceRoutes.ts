import { Router } from 'express';
import * as ctrl from '../../controllers/hr/attendanceController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';

const r = Router();
r.use(authenticate);

r.get('/',       requirePermission('hr:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('hr:read'),  ctrl.getById);
r.post('/',      requirePermission('hr:create'), ctrl.create);
r.put('/:id',    requirePermission('hr:create'), ctrl.update);
r.delete('/:id', requirePermission('hr:create'), ctrl.remove);

export default r;

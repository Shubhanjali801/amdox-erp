import { Router } from 'express';
import * as ctrl from '../../controllers/hr/attendanceController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';

const r = Router();
r.use(authenticate);

r.get('/',       requirePermission('hr:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('hr:read'),  ctrl.getById);
r.post('/',      requirePermission('hr:write'), ctrl.create);
r.put('/:id',    requirePermission('hr:write'), ctrl.update);
r.delete('/:id', requirePermission('hr:write'), ctrl.remove);

export default r;

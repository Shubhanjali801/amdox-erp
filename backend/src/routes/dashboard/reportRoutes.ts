import { Router } from 'express';
import * as ctrl from '../../controllers/dashboard/reportController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createReportSchema, updateReportSchema } from '../../validators/dashboard.validator';

const r = Router();
r.use(authenticate);

// Specific paths BEFORE '/:id'
r.get('/generate/:type', requirePermission('dashboard:read'), ctrl.generate);  // on-demand live report

r.get('/',       requirePermission('dashboard:read'), ctrl.getAll);
r.get('/:id',    requirePermission('dashboard:read'), ctrl.getById);
r.post('/',      requirePermission('dashboard:read'), validate(createReportSchema), ctrl.create);
r.put('/:id',    requirePermission('dashboard:read'), validate(updateReportSchema), ctrl.update);
r.delete('/:id', requirePermission('dashboard:read'), ctrl.remove);
r.post('/:id/run', requirePermission('dashboard:read'), ctrl.run);

export default r;

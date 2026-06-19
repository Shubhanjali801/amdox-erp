import { Router } from 'express';
import * as ctrl from '../../controllers/dashboard/dashboardController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createDashboardSchema, updateDashboardSchema } from '../../validators/dashboard.validator';

const r = Router();
r.use(authenticate);

// Specific path BEFORE '/:id'
r.get('/stats/overview', requirePermission('dashboard:read'), ctrl.statsOverview);

r.get('/',       requirePermission('dashboard:read'), ctrl.getAll);
r.get('/:id',    requirePermission('dashboard:read'), ctrl.getById);
r.post('/',      requirePermission('dashboard:read'), validate(createDashboardSchema), ctrl.create);
r.put('/:id',    requirePermission('dashboard:read'), validate(updateDashboardSchema), ctrl.update);
r.delete('/:id', requirePermission('dashboard:read'), ctrl.remove);

export default r;

import { Router } from 'express';
import * as ctrl from '../../controllers/dashboard/widgetController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createWidgetSchema, updateWidgetSchema } from '../../validators/dashboard.validator';

const r = Router();
r.use(authenticate);

r.get('/',        requirePermission('dashboard:read'), ctrl.getAll);
r.get('/:id',     requirePermission('dashboard:read'), ctrl.getById);
r.get('/:id/data', requirePermission('dashboard:read'), ctrl.getData);  // live data
r.post('/',       requirePermission('dashboard:read'), validate(createWidgetSchema), ctrl.create);
r.put('/:id',     requirePermission('dashboard:read'), validate(updateWidgetSchema), ctrl.update);
r.delete('/:id',  requirePermission('dashboard:read'), ctrl.remove);

export default r;

import { Router } from 'express';
import * as ctrl from '../../controllers/project/budgetController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { updateBudgetSchema } from '../../validators/project.validator';

const r = Router();
r.use(authenticate);

r.get('/',       requirePermission('projects:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('projects:read'),  ctrl.getById);
r.put('/:id',    requirePermission('projects:write'), validate(updateBudgetSchema), ctrl.update);

export default r;

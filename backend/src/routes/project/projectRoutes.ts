import { Router } from 'express';
import * as ctrl from '../../controllers/project/projectController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createProjectSchema, updateProjectSchema, createMilestoneSchema } from '../../validators/project.validator';

const r = Router();
r.use(authenticate);

r.get('/',       requirePermission('project:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('project:read'),  ctrl.getById);
r.post('/',      requirePermission('project:create'), validate(createProjectSchema), ctrl.create);
r.put('/:id',    requirePermission('project:create'), validate(updateProjectSchema), ctrl.update);
r.delete('/:id', requirePermission('project:create'), ctrl.remove);

// Milestones
r.get('/:id/milestones',  requirePermission('project:read'),  ctrl.listMilestones);
r.post('/:id/milestones', requirePermission('project:create'), validate(createMilestoneSchema), ctrl.addMilestone);

export default r;

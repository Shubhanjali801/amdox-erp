import { Router } from 'express';
import * as ctrl from '../../controllers/project/projectController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createProjectSchema, updateProjectSchema, createMilestoneSchema } from '../../validators/project.validator';

const r = Router();
r.use(authenticate);

r.get('/',       requirePermission('projects:read'),  ctrl.getAll);
r.get('/:id',    requirePermission('projects:read'),  ctrl.getById);
r.post('/',      requirePermission('projects:write'), validate(createProjectSchema), ctrl.create);
r.put('/:id',    requirePermission('projects:write'), validate(updateProjectSchema), ctrl.update);
r.delete('/:id', requirePermission('projects:write'), ctrl.remove);

// Milestones
r.get('/:id/milestones',  requirePermission('projects:read'),  ctrl.listMilestones);
r.post('/:id/milestones', requirePermission('projects:write'), validate(createMilestoneSchema), ctrl.addMilestone);

export default r;

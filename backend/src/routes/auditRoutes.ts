import { Router } from 'express';
import * as ctrl from '../controllers/auditController';
import { authenticate, requirePermission } from '../middleware/auth.middleware';

const r = Router();
r.use(authenticate);

// Audit logs are immutable & tamper-evident — read-only API.
r.get('/verify', requirePermission('audit:read'), ctrl.verify);   // specific path before /:id
r.get('/',       requirePermission('audit:read'), ctrl.getAll);
r.get('/:id',    requirePermission('audit:read'), ctrl.getById);

export default r;

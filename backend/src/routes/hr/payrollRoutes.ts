import { Router } from 'express';
import * as ctrl from '../../controllers/hr/payrollController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';

const r = Router();
r.use(authenticate);

// single payslip (before /:id so it isn't matched as a run id)
r.get('/payslip/:id', requirePermission('hr:read'), ctrl.getPayslip);

r.get('/',       requirePermission('hr:read'),    ctrl.getAll);
r.get('/:id',    requirePermission('hr:read'),    ctrl.getById);
r.post('/',      requirePermission('hr:run_payroll'), ctrl.create);   // run payroll
r.put('/:id',    requirePermission('hr:run_payroll'), ctrl.update);
r.delete('/:id', requirePermission('hr:run_payroll'), ctrl.remove);

export default r;

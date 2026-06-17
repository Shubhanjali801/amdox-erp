import { Router } from 'express';
import * as ctrl from '../../controllers/hr/payrollController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';

const r = Router();
r.use(authenticate);

// single payslip (before /:id so it isn't matched as a run id)
r.get('/payslip/:id', requirePermission('payroll:read'), ctrl.getPayslip);

r.get('/',       requirePermission('payroll:read'),    ctrl.getAll);
r.get('/:id',    requirePermission('payroll:read'),    ctrl.getById);
r.post('/',      requirePermission('payroll:approve'), ctrl.create);   // run payroll
r.put('/:id',    requirePermission('payroll:approve'), ctrl.update);
r.delete('/:id', requirePermission('payroll:approve'), ctrl.remove);

export default r;

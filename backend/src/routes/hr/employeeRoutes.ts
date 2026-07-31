import { Router } from 'express';
import * as ctrl from '../../controllers/hr/employeeController';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createEmployeeSchema, employeeQuerySchema, updateEmployeeSchema } from '../../validators/hr.validator';

const r = Router();

r.use(authenticate);
r.get('/departments', ctrl.getDepartments);
r.get('/', validate(employeeQuerySchema, 'query'), ctrl.getAll);
r.get('/:id', ctrl.getById);
r.post('/', validate(createEmployeeSchema), ctrl.create);
r.put('/:id', validate(updateEmployeeSchema), ctrl.update);
r.delete('/:id', ctrl.remove);

export default r;

import { Router } from 'express';
import * as ctrl from '../../controllers/hr/organisationController';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { departmentSchema, updateDepartmentSchema } from '../../validators/hr.validator';

const r = Router();

r.use(authenticate);
r.get('/chart', ctrl.getChart);
r.get('/', ctrl.getAll);
r.get('/:id', ctrl.getById);
r.post('/', validate(departmentSchema), ctrl.create);
r.put('/:id', validate(updateDepartmentSchema), ctrl.update);
r.delete('/:id', ctrl.remove);

export default r;

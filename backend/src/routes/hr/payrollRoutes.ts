import { Router } from 'express';
import * as ctrl from '../../controllers/hr/payrollController';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { payrollRunSchema } from '../../validators/hr.validator';

const r = Router();

r.use(authenticate);
r.get('/', ctrl.getAll);
r.post('/run', validate(payrollRunSchema), ctrl.run);
r.get('/:id', ctrl.getById);
r.post('/', validate(payrollRunSchema), ctrl.create);
r.put('/:id', ctrl.update);
r.delete('/:id', ctrl.remove);

export default r;

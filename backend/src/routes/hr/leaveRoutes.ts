import { Router } from 'express';
import * as ctrl from '../../controllers/hr/leaveController';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { leaveSchema, updateLeaveSchema } from '../../validators/hr.validator';

const r = Router();

r.use(authenticate);
r.get('/types', ctrl.getTypes);
r.get('/', ctrl.getAll);
r.get('/:id', ctrl.getById);
r.post('/', validate(leaveSchema), ctrl.create);
r.put('/:id', validate(updateLeaveSchema), ctrl.update);
r.delete('/:id', ctrl.remove);

export default r;

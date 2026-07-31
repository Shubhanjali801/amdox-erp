import { Router } from 'express';
import * as ctrl from '../../controllers/hr/attendanceController';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { attendanceSchema, updateAttendanceSchema } from '../../validators/hr.validator';

const r = Router();

r.use(authenticate);
r.get('/', ctrl.getAll);
r.get('/:id', ctrl.getById);
r.post('/', validate(attendanceSchema), ctrl.create);
r.put('/:id', validate(updateAttendanceSchema), ctrl.update);
r.delete('/:id', ctrl.remove);

export default r;

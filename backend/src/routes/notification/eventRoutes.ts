import { Router } from 'express';
import * as ctrl from '../../controllers/notification/eventController';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { emitEventSchema } from '../../validators/notification.validator';

const r = Router();
r.use(authenticate);

r.get('/',       ctrl.getAll);                          // event catalog
r.get('/:id',    ctrl.getById);                         // one event definition
r.post('/',      validate(emitEventSchema), ctrl.create); // emit event
r.put('/:id',    ctrl.update);                          // 405
r.delete('/:id', ctrl.remove);                          // 405

export default r;

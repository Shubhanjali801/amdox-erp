import { Router } from 'express';
import * as ctrl from '../../controllers/settings/settingsController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { updateSettingsSchema } from '../../validators/settings.validator';

const r = Router();
r.use(authenticate);

r.get('/',  requirePermission('user:read'),  ctrl.getAll);
r.put('/',  requirePermission('user:create'), validate(updateSettingsSchema), ctrl.update);

export default r;

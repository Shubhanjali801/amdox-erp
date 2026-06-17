import { Router } from 'express';
import * as ctrl from '../../controllers/settings/settingsController';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { updateSettingsSchema } from '../../validators/settings.validator';

const r = Router();
r.use(authenticate);

r.get('/',  requirePermission('users:read'),  ctrl.getAll);
r.put('/',  requirePermission('users:write'), validate(updateSettingsSchema), ctrl.update);

export default r;

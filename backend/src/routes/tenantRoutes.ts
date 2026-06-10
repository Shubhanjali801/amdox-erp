import { Router } from 'express';
import * as tenant         from '../controllers/tenantController';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate }        from '../middleware/validation.middleware';
import { updateTenantSchema } from '../validators/user.validator';

const r = Router();

r.use(authenticate);

// Any authenticated user can view their tenant
r.get('/', tenant.getTenant);

// Only admins can update tenant settings
r.put('/', authorize('tenant_admin', 'super_admin'), validate(updateTenantSchema), tenant.updateTenant);

export default r;

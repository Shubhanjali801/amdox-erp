import { Router } from 'express';
import * as tenant from '../controllers/tenantController';
import { authenticate } from '../middleware/auth.middleware';
const r = Router();
r.use(authenticate);
r.get('/',   tenant.getTenant);
r.put('/',   tenant.updateTenant);
export default r;

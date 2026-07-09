import { Router } from 'express';
import * as user           from '../controllers/userController';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate }        from '../middleware/validation.middleware';
import { createUserSchema, updateUserSchema } from '../validators/user.validator';

const r = Router();

// All user routes require authentication
r.use(authenticate);

r.get('/',       requirePermission('user:read'),  user.getUsers);
r.get('/:id',    requirePermission('user:read'),  user.getUser);
r.post('/',      requirePermission('user:create'), validate(createUserSchema), user.createUser);
r.put('/:id',    requirePermission('user:create'), validate(updateUserSchema), user.updateUser);
r.delete('/:id', requirePermission('user:create'), user.deleteUser);

export default r;

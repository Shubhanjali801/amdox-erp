import { Router } from 'express';
import * as user           from '../controllers/userController';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate }        from '../middleware/validation.middleware';
import { createUserSchema, updateUserSchema } from '../validators/user.validator';

const r = Router();

// All user routes require authentication
r.use(authenticate);

r.get('/',       requirePermission('users:read'),  user.getUsers);
r.get('/:id',    requirePermission('users:read'),  user.getUser);
r.post('/',      requirePermission('users:write'), validate(createUserSchema), user.createUser);
r.put('/:id',    requirePermission('users:write'), validate(updateUserSchema), user.updateUser);
r.delete('/:id', requirePermission('users:write'), user.deleteUser);

export default r;

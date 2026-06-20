import { Router } from 'express';
import * as auth        from '../controllers/authController';
import { authenticate } from '../middleware/auth.middleware';
import { validate }     from '../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';

const router = Router();

// ── Public routes (no JWT needed) ─────────────────────────
router.post('/register', validate(registerSchema), auth.register);
router.post('/login',    validate(loginSchema),    auth.login);
// refresh reads token from httpOnly cookie OR body — no body validation
router.post('/refresh',  auth.refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), auth.forgotPassword);
router.post('/reset-password',  validate(resetPasswordSchema),  auth.resetPassword);

// ── Protected routes (JWT required) ───────────────────────
router.post('/logout',         authenticate,                              auth.logout);
router.get('/me',              authenticate,                              auth.me);
router.put('/change-password', authenticate, validate(changePasswordSchema), auth.changePassword);

export default router;

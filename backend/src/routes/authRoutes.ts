import { Router } from 'express';
import * as auth        from '../controllers/authController';
import { authenticate } from '../middleware/auth.middleware';
import { validate }     from '../middleware/validation.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';

const router = Router();

// ── Public routes (no JWT needed) ─────────────────────────
// authRateLimiter (10 / 15min per IP) guards the credential-accepting routes
// against brute-force / credential-stuffing, on top of the global limiter.
router.post('/register', authRateLimiter, validate(registerSchema), auth.register);
router.post('/login',    authRateLimiter, validate(loginSchema),    auth.login);
// refresh reads token from httpOnly cookie OR body — no body validation
router.post('/refresh',  auth.refresh);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), auth.forgotPassword);
router.post('/reset-password',  authRateLimiter, validate(resetPasswordSchema),  auth.resetPassword);

// ── Protected routes (JWT required) ───────────────────────
router.post('/logout',         authenticate,                              auth.logout);
router.get('/me',              authenticate,                              auth.me);
router.put('/change-password', authenticate, validate(changePasswordSchema), auth.changePassword);

// ── MFA (TOTP) ──
router.post('/mfa/setup',   authenticate, auth.mfaSetup);
router.post('/mfa/enable',  authenticate, auth.mfaEnable);
router.post('/mfa/disable', authenticate, auth.mfaDisable);

export default router;

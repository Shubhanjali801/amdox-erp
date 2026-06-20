import { Request, Response, NextFunction } from 'express';
import { authService }  from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';

// ─── Register ─────────────────────────────────────────────
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, password, companyName, companySlug } = req.body;

    const result = await authService.register({
      firstName, lastName, email, password, companyName, companySlug,
    });

    return sendSuccess(res, {
      tenant: {
        id:   result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
      user: {
        id:        result.user.id,
        email:     result.user.email,
        firstName: result.user.firstName,
        lastName:  result.user.lastName,
      },
    }, 'Account created successfully', 201);

  } catch (err: any) {
    if (err.message === 'EMAIL_TAKEN')  return sendError(res, 'Email already registered', 409);
    if (err.message === 'SLUG_TAKEN')   return sendError(res, 'Company name already taken', 409);
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, mfaToken } = req.body;

    const result = await authService.login({
      email,
      password,
      mfaToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return sendSuccess(res, {
      user:         result.user,
      accessToken:  result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken, // also returned for API clients (Postman/mobile)
      expiresIn:    result.tokens.expiresIn,
    }, 'Login successful');

  } catch (err: any) {
    if (err.message === 'INVALID_CREDENTIALS') return sendError(res, 'Invalid email or password', 401);
    if (err.message === 'ACCOUNT_INACTIVE')    return sendError(res, 'Account is deactivated', 403);
    if (err.message === 'TENANT_INACTIVE')     return sendError(res, 'Your organisation account is inactive', 403);
    // MFA: tell the client to prompt for a 6-digit code (not an error state)
    if (err.message === 'MFA_REQUIRED')        return res.status(200).json({ success: false, mfaRequired: true, message: 'Enter your authenticator code' });
    if (err.message === 'INVALID_MFA_TOKEN')   return sendError(res, 'Invalid authenticator code', 401);
    next(err);
  }
};

// ─── MFA: setup (returns QR), enable, disable ─────────────
export const mfaSetup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const result = await authService.setupMfa(userId);
    return sendSuccess(res, result, 'Scan the QR with your authenticator app, then verify a code to enable.');
  } catch (err) { next(err); }
};

export const mfaEnable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    await authService.enableMfa(userId, req.body.token);
    return sendSuccess(res, {}, 'MFA enabled');
  } catch (err: any) {
    if (err.message === 'MFA_NOT_SETUP')     return sendError(res, 'Run MFA setup first', 400);
    if (err.message === 'INVALID_MFA_TOKEN') return sendError(res, 'Invalid authenticator code', 400);
    next(err);
  }
};

export const mfaDisable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    await authService.disableMfa(userId, req.body.token);
    return sendSuccess(res, {}, 'MFA disabled');
  } catch (err: any) {
    if (err.message === 'INVALID_MFA_TOKEN') return sendError(res, 'Invalid authenticator code', 400);
    next(err);
  }
};

// ─── Refresh Token ────────────────────────────────────────
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Accept from cookie OR request body
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) return sendError(res, 'Refresh token required', 400);

    const tokens = await authService.refresh(refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, {
      accessToken: tokens.accessToken,
      expiresIn:   tokens.expiresIn,
    }, 'Token refreshed');

  } catch (err: any) {
    if (err.message === 'INVALID_REFRESH_TOKEN')  return sendError(res, 'Invalid refresh token', 401);
    if (err.message === 'REFRESH_TOKEN_EXPIRED')  return sendError(res, 'Session expired, please login again', 401);
    next(err);
  }
};

// ─── Logout ───────────────────────────────────────────────
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const userId       = (req as any).user?.userId;

    if (refreshToken && userId) {
      await authService.logout(refreshToken, userId);
    }

    // Clear cookie
    res.clearCookie('refreshToken');

    return sendSuccess(res, {}, 'Logged out successfully');

  } catch (err) {
    next(err);
  }
};

// ─── Get Me ───────────────────────────────────────────────
export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return sendError(res, 'Unauthorized', 401);

    const user = await authService.getMe(userId);
    return sendSuccess(res, user, 'User profile fetched');

  } catch (err: any) {
    if (err.message === 'USER_NOT_FOUND') return sendError(res, 'User not found', 404);
    next(err);
  }
};

// ─── Change Password ──────────────────────────────────────
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId      = (req as any).user?.userId;
    const { oldPassword, newPassword } = req.body;

    await authService.changePassword(userId, oldPassword, newPassword);

    res.clearCookie('refreshToken');
    return sendSuccess(res, {}, 'Password changed successfully. Please login again.');

  } catch (err: any) {
    if (err.message === 'INVALID_CREDENTIALS') return sendError(res, 'Current password is incorrect', 400);
    next(err);
  }
};

// POST /auth/forgot-password  { email }
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.forgotPassword(req.body.email);
    // Always the same response, whether or not the email exists
    return sendSuccess(res, {}, 'If that email is registered, a reset link has been sent.');
  } catch (err) {
    next(err);
  }
};

// POST /auth/reset-password  { token, newPassword }
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    return sendSuccess(res, {}, 'Password reset successfully. Please log in.');
  } catch (err: any) {
    if (err.message === 'INVALID_OR_EXPIRED_TOKEN')
      return sendError(res, 'This reset link is invalid or has expired', 400);
    next(err);
  }
};

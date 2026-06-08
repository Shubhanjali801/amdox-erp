import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import prisma from '../config/database';

export const authService = {
  hashPassword:   (pw: string)      => bcrypt.hash(pw, 12),
  comparePassword:(pw: string, hash: string) => bcrypt.compare(pw, hash),
  signAccessToken: (payload: object) => jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN || '15m' }),
  signRefreshToken:(payload: object) => jwt.sign(payload, ENV.JWT_REFRESH_SECRET, { expiresIn: '7d' }),
  verifyToken:    (token: string)    => jwt.verify(token, ENV.JWT_SECRET),
};

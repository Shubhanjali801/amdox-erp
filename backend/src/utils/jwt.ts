import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
export const signToken    = (payload: any) => jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '15m' });
export const verifyToken  = (token: string) => jwt.verify(token, ENV.JWT_SECRET);

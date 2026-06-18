import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ENV } from '../../../config/env';

export interface JwtPayload {
  userId:      string;
  tenantId:    string;
  email:       string;
  roles:       string[];
  permissions: string[];
}

/**
 * Validates the Bearer token signature + expiry.
 * The returned object becomes `req.user`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: ENV.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    return {
      userId:      payload.userId,
      tenantId:    payload.tenantId,
      email:       payload.email,
      roles:       payload.roles || [],
      permissions: payload.permissions || [],
    };
  }
}

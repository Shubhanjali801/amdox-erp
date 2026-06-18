import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { authService as legacyAuth } from '../../services/authService';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

/**
 * NestJS AuthService.
 * Wraps the existing, fully-tested auth logic and maps domain
 * errors to proper NestJS HTTP exceptions.
 */
@Injectable()
export class AuthService {
  async register(dto: RegisterDto) {
    try {
      const result = await legacyAuth.register(dto);
      return {
        tenant: { id: result.tenant.id, name: result.tenant.name, slug: result.tenant.slug },
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
      };
    } catch (err: any) {
      if (err.message === 'EMAIL_TAKEN') throw new ConflictException('Email already registered');
      if (err.message === 'SLUG_TAKEN') throw new ConflictException('Company slug already taken');
      throw err;
    }
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    try {
      return await legacyAuth.login({ ...dto, ipAddress, userAgent });
    } catch (err: any) {
      if (err.message === 'INVALID_CREDENTIALS')
        throw new UnauthorizedException('Invalid email or password');
      if (err.message === 'ACCOUNT_INACTIVE')
        throw new ForbiddenException('Account is deactivated');
      if (err.message === 'TENANT_INACTIVE')
        throw new ForbiddenException('Your organisation account is inactive');
      throw err;
    }
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new BadRequestException('Refresh token required');
    try {
      return await legacyAuth.refresh(refreshToken);
    } catch (err: any) {
      if (err.message === 'INVALID_REFRESH_TOKEN')
        throw new UnauthorizedException('Invalid refresh token');
      if (err.message === 'REFRESH_TOKEN_EXPIRED')
        throw new UnauthorizedException('Session expired, please login again');
      throw err;
    }
  }

  async logout(refreshToken: string, userId: string) {
    if (refreshToken && userId) await legacyAuth.logout(refreshToken, userId);
    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    try {
      return await legacyAuth.getMe(userId);
    } catch (err: any) {
      if (err.message === 'USER_NOT_FOUND') throw new NotFoundException('User not found');
      throw err;
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    try {
      await legacyAuth.changePassword(userId, dto.oldPassword, dto.newPassword);
      return { message: 'Password changed successfully. Please login again.' };
    } catch (err: any) {
      if (err.message === 'INVALID_CREDENTIALS')
        throw new BadRequestException('Current password is incorrect');
      throw err;
    }
  }
}

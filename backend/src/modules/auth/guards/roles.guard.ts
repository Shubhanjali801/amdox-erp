import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, PERMISSIONS_KEY } from '../decorators/auth.decorators';

/**
 * Enforces @Roles() and @RequirePermissions() metadata.
 * Runs after JwtAuthGuard (req.user is populated).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPerms = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No restriction declared → allow
    if (!requiredRoles?.length && !requiredPerms?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Unauthorized');

    if (requiredRoles?.length) {
      const ok = requiredRoles.some((r) => user.roles?.includes(r));
      if (!ok) throw new ForbiddenException('Insufficient role');
    }

    if (requiredPerms?.length) {
      const ok = requiredPerms.every((p) => user.permissions?.includes(p));
      if (!ok) throw new ForbiddenException(`Missing permission: ${requiredPerms.join(', ')}`);
    }

    return true;
  }
}

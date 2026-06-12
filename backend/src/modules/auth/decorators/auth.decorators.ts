import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

// ─── Metadata keys ────────────────────────────────────────
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';

/**
 * Require one of the given roles.
 * Usage: @Roles('tenant_admin', 'super_admin')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Require a specific permission.
 * Usage: @RequirePermissions('users:write')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Inject the authenticated user into a handler param.
 * Usage: create(@CurrentUser() user) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user?.[data] : request.user;
  },
);

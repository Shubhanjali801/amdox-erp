// ─────────────────────────────────────────────────────────────────────────────
// Client-side RBAC helpers.
//
// The access token (JWT) carries the user's `roles` and `permissions` (format
// `resource:action`, e.g. "finance:read"), signed by the backend. We decode it
// here ONLY to drive the UI — hiding menus/routes the user can't use. Real
// enforcement still happens server-side via requirePermission() (returns 403),
// so this is convenience, not the security boundary.
// ─────────────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string
  tenantId: string
  email: string
  roles: string[]
  permissions: string[]
  exp?: number
}

/** Decode the JWT payload from localStorage. Returns null if missing/invalid. */
export function decodeToken(): JwtPayload | null {
  const token = localStorage.getItem('accessToken')
  if (!token) return null
  try {
    const part = token.split('.')[1]
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch {
    return null
  }
}

export const getPermissions = (): string[] => decodeToken()?.permissions ?? []
export const getRoles = (): string[] => decodeToken()?.roles ?? []

/** True if the user has the given permission (e.g. "finance:read"). */
export const hasPermission = (perm: string): boolean => getPermissions().includes(perm)

/** True if the user has ANY of the given permissions. */
export const hasAnyPermission = (perms: string[]): boolean => {
  const owned = getPermissions()
  return perms.some((p) => owned.includes(p))
}

// ── Module registry: what permission unlocks each area, and where it lands ────
export interface ModuleDef {
  key: string
  label: string
  icon: string
  perm: string      // the `resource:read` permission that grants access
  path: string      // default landing route for the module
}

export const MODULES: ModuleDef[] = [
  { key: 'dashboard',    label: 'Dashboard',     icon: '📊', perm: 'dashboard:read',    path: '/dashboard' },
  { key: 'finance',      label: 'Finance',       icon: '💰', perm: 'finance:read',      path: '/finance/ledger' },
  { key: 'hr',           label: 'HR & Payroll',  icon: '👥', perm: 'hr:read',           path: '/hr/employees' },
  { key: 'supply_chain', label: 'Supply Chain',  icon: '📦', perm: 'supply_chain:read', path: '/supply-chain/vendors' },
  { key: 'project',      label: 'Projects',      icon: '📋', perm: 'project:read',      path: '/projects' },
]

/** Modules the current user is allowed to see (used to build the sidebar). */
export const accessibleModules = (): ModuleDef[] => {
  const owned = getPermissions()
  return MODULES.filter((m) => owned.includes(m.perm))
}

/** Settings is admin-only (manage users / roles / tenant). */
export const canAccessSettings = (): boolean =>
  hasAnyPermission(['settings:read', 'user:read', 'settings:update'])

/**
 * First place a user can actually go after login. Prefer the dashboard, then
 * the first module they have access to, else the "no access" page.
 */
export function firstAccessiblePath(): string {
  const owned = getPermissions()
  const m = MODULES.find((x) => owned.includes(x.perm))
  if (m) return m.path
  if (canAccessSettings()) return '/settings'
  return '/no-access'
}

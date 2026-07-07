import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { hasAnyPermission, firstAccessiblePath } from '../../utils/permissions'

/**
 * Route guard: renders the child routes only if the user holds one of `perms`.
 * Otherwise it bounces them to the first area they CAN access (or /no-access),
 * so a Finance Manager who types /hr in the URL is redirected away.
 */
const RequirePermission: React.FC<{ perms: string[] }> = ({ perms }) => {
  if (hasAnyPermission(perms)) return <Outlet />
  return <Navigate to={firstAccessiblePath()} replace />
}

export default RequirePermission

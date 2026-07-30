/**
 * Keycloak (OIDC) SSO for the SPA — the frontend half of the feature whose
 * backend lives in backend/src/services/auth/keycloakService.ts.
 *
 * Flow: the user clicks "Sign in with SSO" → redirect to Keycloak (Authorization
 * Code + PKCE) → back to /login → keycloak-js exchanges the code for tokens →
 * we stash the access token where the axios interceptor already looks
 * (localStorage `accessToken`) and call /auth/me so the app gets the same user
 * shape (tenant/roles/permissions) it gets from a local login.
 *
 * Entirely gated by FEATURES.KEYCLOAK_SSO — when off, none of this runs and the
 * classic email/password login is unchanged.
 */
import Keycloak from 'keycloak-js'
import { ENV } from '../config/env'
import { FEATURES } from '../config/featureFlags'
import api from './api'
import { API_ENDPOINTS } from '../config/apiConfig'

let keycloak: Keycloak | null = null
let initPromise: Promise<boolean> | null = null

function getKeycloak(): Keycloak {
  if (!keycloak) {
    keycloak = new Keycloak({
      url: ENV.KEYCLOAK_URL,
      realm: ENV.KEYCLOAK_REALM,
      clientId: ENV.KEYCLOAK_CLIENT_ID,
    })
  }
  return keycloak
}

/**
 * Initialise the adapter once. Called on the Login page so a redirect back from
 * Keycloak (with the auth code in the URL) is processed. Resolves to whether the
 * user is authenticated. Safe to call when SSO is disabled (returns false).
 */
export function initKeycloak(): Promise<boolean> {
  if (!FEATURES.KEYCLOAK_SSO) return Promise.resolve(false)
  if (!initPromise) {
    initPromise = getKeycloak()
      .init({ onLoad: 'check-sso', pkceMethod: 'S256', checkLoginIframe: false })
      .catch(() => false)
  }
  return initPromise
}

/** Redirect to the Keycloak login page. Returns to `/login` to be finalised. */
export function keycloakLogin(): void {
  getKeycloak().login({ redirectUri: `${window.location.origin}/login` })
}

/**
 * After a successful Keycloak login, persist the access token and hydrate the
 * app user from /auth/me (the backend maps the Keycloak identity → app user).
 * Returns the app user, or throws if the ERP has not provisioned this identity.
 */
export async function completeSsoSession(): Promise<any> {
  const kc = getKeycloak()
  if (!kc.token) throw new Error('No Keycloak token after login')

  localStorage.setItem('accessToken', kc.token)
  if (kc.refreshToken) localStorage.setItem('kcRefreshToken', kc.refreshToken)
  localStorage.setItem('authProvider', 'keycloak')

  // Backend verifies the Keycloak token and returns the app user (roles/perms).
  const res = await api.get(API_ENDPOINTS.AUTH.ME)
  const user = res.data?.data ?? res.data
  localStorage.setItem('user', JSON.stringify(user))
  if (user.tenantId) localStorage.setItem('tenantId', user.tenantId)

  keepTokenFresh()
  return user
}

/**
 * Keep the stored access token fresh via Keycloak (the app's /auth/refresh flow
 * does not apply to Keycloak sessions). Refreshes ~1 min before expiry.
 */
function keepTokenFresh(): void {
  const kc = getKeycloak()
  kc.onTokenExpired = () => {
    kc.updateToken(60)
      .then((refreshed) => {
        if (refreshed && kc.token) localStorage.setItem('accessToken', kc.token)
      })
      .catch(() => {
        // Refresh failed — drop the session; the API interceptor will bounce
        // the user to /login on the next 401.
        localStorage.removeItem('accessToken')
      })
  }
}

/** Whether the current app session was established via Keycloak. */
export function isSsoSession(): boolean {
  return localStorage.getItem('authProvider') === 'keycloak'
}

/** SSO-aware logout: end the Keycloak session too, then clear local state. */
export async function keycloakLogout(): Promise<void> {
  const provider = localStorage.getItem('authProvider')
  ;['accessToken', 'refreshToken', 'kcRefreshToken', 'user', 'tenantId', 'authProvider'].forEach((k) =>
    localStorage.removeItem(k),
  )
  if (provider === 'keycloak' && keycloak) {
    await getKeycloak().logout({ redirectUri: `${window.location.origin}/login` })
  }
}

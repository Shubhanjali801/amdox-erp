/**
 * Keycloak SSO support (feature-flagged by ENV.KEYCLOAK_ENABLED).
 *
 * Keycloak handles *authentication* (proving who the user is via OIDC); this app
 * keeps ownership of *authorization* (tenant + roles + permissions). A verified
 * Keycloak access token is mapped to the local app user by email, and that
 * user's existing RBAC (roles/permissions) is what the rest of the app enforces
 * — so nothing about the permission model changes.
 *
 * Tokens are verified offline against the realm's JWKS (RS256), so no network
 * round-trip to Keycloak per request after the keys are cached.
 */
import jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import prisma from '../../config/database';
import { ENV } from '../../config/env';
import { logger } from '../../utils/logger';

export interface AppIdentity {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

// Realm URL the backend can reach in-cluster (for fetching signing keys).
const realmUrl = `${ENV.KEYCLOAK_URL.replace(/\/$/, '')}/realms/${ENV.KEYCLOAK_REALM}`;
// Issuer string as it appears in the token's `iss` claim (browser-facing URL in
// a split-host setup; falls back to the internal realm URL for local dev).
const expectedIssuer = ENV.KEYCLOAK_ISSUER || realmUrl;

let jwks: JwksClient | null = null;
function jwksClient(): JwksClient {
  if (!jwks) {
    jwks = new JwksClient({
      jwksUri: `${realmUrl}/protocol/openid-connect/certs`,
      cache: true,
      cacheMaxAge: 10 * 60 * 1000, // 10 min
      rateLimit: true,
    });
  }
  return jwks;
}

/** Resolve the RS256 signing key for a token's `kid` from the realm JWKS. */
function getSigningKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  if (!header.kid) return callback(new Error('token has no kid'));
  jwksClient().getSigningKey(header.kid, (err, key) => {
    if (err || !key) return callback(err || new Error('signing key not found'));
    callback(null, key.getPublicKey());
  });
}

/** Verify a Keycloak-issued access token (RS256, issuer-checked). */
export function verifyKeycloakToken(token: string): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      { algorithms: ['RS256'], issuer: expectedIssuer },
      (err, decoded) => (err ? reject(err) : resolve(decoded as Record<string, any>)),
    );
  });
}

/**
 * Map a verified Keycloak identity to the local app user by email, returning the
 * same shape the local login builds (tenant + roles + permissions). Returns null
 * if no active app user matches — Keycloak can authenticate someone the ERP has
 * not provisioned, and we do not grant access to unknown users.
 */
export async function resolveAppUserByEmail(email: string): Promise<AppIdentity | null> {
  if (!email) return null;
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    include: {
      userRoles: {
        include: {
          role: { include: { permissions: { include: { permission: true } } } },
        },
      },
    },
  });
  if (!user) return null;

  const roles = user.userRoles.map((ur: any) => ur.role.name);
  const permissions = user.userRoles.flatMap((ur: any) =>
    ur.role.permissions.map((rp: any) => `${rp.permission.resource}:${rp.permission.action}`),
  );

  return { userId: user.id, tenantId: user.tenantId, email: user.email, roles, permissions };
}

/**
 * Full path used by the auth middleware: verify the Keycloak token, then map it
 * to the local user. Throws on an invalid token or an unprovisioned user.
 */
export async function authenticateKeycloak(token: string): Promise<AppIdentity> {
  const claims = await verifyKeycloakToken(token);
  const email = claims.email || claims.preferred_username;
  const identity = await resolveAppUserByEmail(email);
  if (!identity) {
    logger.warn(`Keycloak login for "${email}" rejected: no matching active app user`);
    throw new Error('No matching app user for this SSO identity');
  }
  return identity;
}

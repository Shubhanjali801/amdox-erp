# Security Guide — Amdox ERP

## Authentication
- JWT RS256 tokens (15 min expiry)
- Refresh tokens (7 days, rotated on use)
- MFA via TOTP (Google Authenticator compatible)
- SSO via Keycloak 25 (OIDC + SAML 2.0)

## Authorization
- RBAC: super_admin > tenant_admin > manager > viewer
- 33 granular permissions across 7 resources
- Row-level tenant isolation on every query

## Data Security
- Passwords: bcrypt (cost 12)
- Sensitive fields: AES-256-GCM encryption
- TLS 1.3 required in production
- CORS: allowlist only

## OWASP Top 10 Controls
- A1 Broken Access Control: RBAC + tenantId guard on all queries
- A2 Cryptographic Failures: bcrypt + AES-256
- A3 Injection: Prisma parameterized queries (no raw SQL in app code)
- A4 Insecure Design: rate limiting (100 req/15min global, 5 req/15min auth)
- A7 Auth Failures: MFA, token rotation, session revocation

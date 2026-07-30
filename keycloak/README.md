# Keycloak SSO (OIDC)

Keycloak adds enterprise **single sign-on** to Amdox ERP. It is layered on top of
the existing auth, not a replacement:

- **Keycloak owns authentication** — proving *who* the user is (OIDC login,
  password policies, and later social/Azure-AD federation).
- **The ERP still owns authorization** — *what* the user may do (tenant + roles +
  permissions), exactly as before. A verified Keycloak token is mapped to the
  local app user **by email**, and that user's existing RBAC is enforced.

Because of that split, the whole feature is behind a flag (`KEYCLOAK_ENABLED`,
default `false`). With it off, the backend only accepts the local HS256 JWTs and
behaves identically to today. With it on, the backend *also* accepts Keycloak
RS256 access tokens — the two are told apart by the token's `alg`, so existing
logins keep working during rollout.

## How a request is authenticated

```
Browser ──login──▶ Keycloak (/keycloak/realms/amdox-erp)
   │  gets an RS256 access token
   ▼
Browser ──Bearer token──▶ Backend /api/v1/*
                             │  alg=RS256 & KEYCLOAK_ENABLED?
                             │   ├─ verify signature offline via realm JWKS
                             │   ├─ check issuer
                             │   └─ map token.email → app user (tenant/roles/perms)
                             ▼
                          normal RBAC (requirePermission) runs unchanged
```

Backend code: `backend/src/services/auth/keycloakService.ts` (JWKS verify + user
mapping) and `backend/src/middleware/auth.middleware.ts` (the RS256-vs-HS256
branch). Config lives in `backend/src/config/env.ts` (`KEYCLOAK_*`).

## Deploy (opt-in)

```bash
# 1. Realm ConfigMap from the committed file (kept in sync, no drift)
kubectl -n amdox create configmap keycloak-realm \
  --from-file=realm-amdox.json=keycloak/realm-amdox.json \
  --dry-run=client -o yaml | kubectl apply -f -

# 2. Keycloak itself (dev mode, embedded H2, auto-imports the realm)
kubectl -n amdox scale deploy/ml-service --replicas=0   # free RAM on the 8GB node
kubectl apply -f k8s/12-keycloak.yaml
kubectl -n amdox rollout status deploy/keycloak

# 3. Turn the backend on and redeploy so it accepts Keycloak tokens
#    (set KEYCLOAK_ENABLED=true in deploy.env, then:)
KEYCLOAK_ENABLED=true ./k8s/deploy-k3s.sh
```

Admin console: `https://<domain>/keycloak/` (user `admin`, password = the
`POSTGRES_PASSWORD` secret, reused for the demo).

## Test end-to-end with curl (no frontend needed)

The `amdox-frontend` client has direct-access-grants enabled for testing, and the
realm ships a demo user `admin@amdox.com` that maps to the seeded super-admin.

```bash
BASE=https://13.127.204.51.nip.io

# 1. Get a Keycloak access token
TOKEN=$(curl -sk -X POST \
  "$BASE/keycloak/realms/amdox-erp/protocol/openid-connect/token" \
  -d client_id=amdox-frontend -d grant_type=password \
  -d username=admin@amdox.com -d password=Admin@1234 \
  | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# 2. Call the ERP API with the Keycloak token — backend verifies it via JWKS,
#    maps the email to the super-admin, and returns data.
curl -sk "$BASE/api/v1/hr/employees" -H "Authorization: Bearer $TOKEN"
```

A 200 with employee data proves the full SSO path: Keycloak-issued token →
JWKS signature check → email→app-user mapping → RBAC.

## Security / honest caveats

- **Dev mode.** `start-dev` uses an embedded H2 DB — fine for a demo, **not**
  production HA. Production Keycloak wants `start` + an external Postgres (it can
  reuse the cluster Postgres with its own `keycloak` database) and a fixed
  `KC_HOSTNAME`.
- **Demo secrets.** The realm file contains a demo user password and a
  placeholder backend-client secret (`CHANGE_ME_backend_client_secret`). Rotate
  both before any real use; never commit real secrets.
- **Unprovisioned users are rejected.** Keycloak can authenticate an identity the
  ERP has never seen; such a login is denied (no app user → no access) rather
  than auto-provisioned, so tenant isolation is preserved.

## Frontend "Sign in with SSO" button

The login page renders a **Sign in with SSO** button when the frontend is built
with `VITE_KEYCLOAK_SSO=true` (the `deploy-k3s.sh` frontend build passes this
automatically when `KEYCLOAK_ENABLED=true`). Flow:

1. Button click → redirect to Keycloak (Authorization Code + **PKCE** via
   `keycloak-js`).
2. Back at `/login`, the adapter exchanges the code for tokens
   (`src/services/keycloak.ts`).
3. The access token is stored where the axios interceptor already looks, and
   `/auth/me` hydrates the app user (tenant/roles/permissions) — identical to a
   local login from there on.
4. `keycloak-js` refreshes the token in the background; logout ends the Keycloak
   session too (`useAuth` is SSO-aware).

Everything is gated by `FEATURES.KEYCLOAK_SSO`, so with the flag off the button
is hidden and the classic email/password login is untouched.

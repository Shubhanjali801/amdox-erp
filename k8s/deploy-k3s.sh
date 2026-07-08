#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Amdox ERP — one-shot k3s deploy for a single EC2 node.
# Builds the 3 images, imports them into k3s, wires config/secrets/ingress,
# installs cert-manager, and applies all manifests. Idempotent — safe to re-run.
#
# Prereqs on the box: docker, k3s (with kubectl), and a filled-in ./deploy.env
# Run from the k8s/ directory:   sudo -E ./deploy-k3s.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
CERT_MANAGER_VERSION="v1.15.3"

# ── Load config ──────────────────────────────────────────────────────────────
if [[ ! -f "$HERE/deploy.env" ]]; then
  echo "ERROR: $HERE/deploy.env not found. Copy deploy.env.example and fill it in." >&2
  exit 1
fi
set -a; source "$HERE/deploy.env"; set +a

: "${DOMAIN:?set DOMAIN in deploy.env}"
: "${LETSENCRYPT_EMAIL:?set LETSENCRYPT_EMAIL in deploy.env}"
: "${DB_PASSWORD:?set DB_PASSWORD in deploy.env}"
: "${JWT_SECRET:?set JWT_SECRET in deploy.env}"
: "${JWT_REFRESH_SECRET:?set JWT_REFRESH_SECRET in deploy.env}"

KUBECTL="k3s kubectl"

echo "▶ [1/7] Building images (this takes a few minutes; the ML image is large)…"
docker build -t amdox-backend:latest  "$ROOT/backend"
docker build -t amdox-ml:latest       "$ROOT/ml-service"
# Frontend calls a RELATIVE API path; Traefik ingress routes /api → backend.
docker build --build-arg VITE_API_BASE_URL=/api/v1 \
             -t amdox-frontend:latest "$ROOT/frontend"

echo "▶ [2/7] Importing images into k3s containerd…"
for img in amdox-backend amdox-frontend amdox-ml; do
  docker save "$img:latest" | k3s ctr images import -
done

echo "▶ [3/7] Namespace…"
$KUBECTL apply -f "$HERE/00-namespace.yaml"

echo "▶ [4/7] Config + secrets (generated from deploy.env)…"
$KUBECTL -n amdox create configmap amdox-config \
  --from-literal=NODE_ENV=production \
  --from-literal=PORT=5000 \
  --from-literal=ML_SERVICE_URL=http://ml-service:8000 \
  --from-literal=ML_SERVICE_API_KEY=dev_ml_api_key_change_in_prod \
  --from-literal=CLIENT_URL="https://$DOMAIN" \
  --from-literal=FRONTEND_URL="https://$DOMAIN" \
  --from-literal=CORS_ORIGINS="https://$DOMAIN" \
  --dry-run=client -o yaml | $KUBECTL apply -f -

$KUBECTL -n amdox create secret generic amdox-secrets \
  --from-literal=DATABASE_URL="postgresql://amdox:${DB_PASSWORD}@postgres:5432/amdox_erp" \
  --from-literal=REDIS_URL="redis://redis:6379" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
  --from-literal=POSTGRES_PASSWORD="$DB_PASSWORD" \
  --from-literal=GMAIL_USER="${GMAIL_USER:-}" \
  --from-literal=GMAIL_APP_PASSWORD="${GMAIL_APP_PASSWORD:-}" \
  --dry-run=client -o yaml | $KUBECTL apply -f -

echo "▶ [5/7] Data + app workloads…"
$KUBECTL apply -f "$HERE/02-postgres.yaml"
$KUBECTL apply -f "$HERE/03-redis.yaml"
$KUBECTL apply -f "$HERE/04-backend.yaml"
$KUBECTL apply -f "$HERE/05-frontend.yaml"
$KUBECTL apply -f "$HERE/06-ml-service.yaml"
# Optional extras — ignore if the files are absent
[[ -f "$HERE/08-hpa.yaml" ]]        && $KUBECTL apply -f "$HERE/08-hpa.yaml"        || true

echo "▶ [6/7] cert-manager (for Let's Encrypt TLS)…"
if ! $KUBECTL get ns cert-manager >/dev/null 2>&1; then
  $KUBECTL apply -f "https://github.com/cert-manager/cert-manager/releases/download/${CERT_MANAGER_VERSION}/cert-manager.yaml"
  echo "   waiting for cert-manager to be ready…"
  $KUBECTL -n cert-manager rollout status deploy/cert-manager --timeout=180s
  $KUBECTL -n cert-manager rollout status deploy/cert-manager-webhook --timeout=180s
fi

echo "▶ [7/7] Ingress + TLS issuer (domain: $DOMAIN)…"
sed -e "s|<DOMAIN>|$DOMAIN|g" -e "s|<EMAIL>|$LETSENCRYPT_EMAIL|g" \
    "$HERE/07-ingress.yaml" | $KUBECTL apply -f -

echo
echo "✅ Deploy applied. Watch it come up with:"
echo "     k3s kubectl -n amdox get pods -w"
echo "   Certificate status (should become Ready in 1–3 min):"
echo "     k3s kubectl -n amdox get certificate"
echo "   Then open:  https://$DOMAIN"

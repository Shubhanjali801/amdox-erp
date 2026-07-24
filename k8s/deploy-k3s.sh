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

# ── Image tag = git commit SHA ───────────────────────────────────────────────
# Immutable, per-commit tags (never ":latest"). Two reasons:
#   1. A bad build can't overwrite a good image — the previous one stays
#      addressable, so `rollback.sh` can point back at it.
#   2. Changing the image field bumps the Deployment's pod spec, so Kubernetes
#      records a real revision and `kubectl rollout undo` actually works.
#      With a fixed ":latest" the spec never changes and rollback is a no-op.
TAG="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo "manual-$(date +%Y%m%d-%H%M%S)")"
echo "▶ Building image tag: $TAG"

echo "▶ [1/7] Building images (this takes a few minutes; the ML image is large)…"
docker build -t "amdox-backend:$TAG"  "$ROOT/backend"
docker build -t "amdox-ml:$TAG"       "$ROOT/ml-service"
# Frontend calls a RELATIVE API path; Traefik ingress routes /api → backend.
docker build --build-arg VITE_API_BASE_URL=/api/v1 \
             -t "amdox-frontend:$TAG" "$ROOT/frontend"

echo "▶ [2/7] Importing images into k3s containerd…"
for img in amdox-backend amdox-frontend amdox-ml; do
  docker save "$img:$TAG" | k3s ctr images import -
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

echo "▶ [5/7] Data + app workloads (image tag: $TAG)…"
$KUBECTL apply -f "$HERE/02-postgres.yaml"
$KUBECTL apply -f "$HERE/03-redis.yaml"
# Swap the manifests' placeholder ":latest" for this build's immutable SHA tag.
# Because the image field changes each deploy, Kubernetes records a new
# revision — which is exactly what makes `kubectl rollout undo` work.
for f in 04-backend.yaml 05-frontend.yaml 06-ml-service.yaml; do
  sed -e "s|amdox-backend:latest|amdox-backend:$TAG|g" \
      -e "s|amdox-frontend:latest|amdox-frontend:$TAG|g" \
      -e "s|amdox-ml:latest|amdox-ml:$TAG|g" \
      "$HERE/$f" | $KUBECTL apply -f -
done
# Optional extras — ignore if the files are absent
[[ -f "$HERE/08-hpa.yaml" ]]        && $KUBECTL apply -f "$HERE/08-hpa.yaml"        || true

# Record what was deployed, so rollback.sh can show a history of good builds.
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)  $TAG" >> "$HERE/.deploy-history"

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
echo "▶ Waiting for the backend rollout to succeed…"
if $KUBECTL -n amdox rollout status deploy/backend --timeout=180s; then
  echo "✅ Backend healthy on tag $TAG"
else
  echo
  echo "❌ Backend rollout FAILED on tag $TAG — the previous version keeps serving."
  echo "   Roll back:  sudo ./rollback.sh"
  echo "   See why:    k3s kubectl -n amdox logs deploy/backend --previous --tail=40"
  exit 1
fi

echo
echo "✅ Deploy applied  (image tag: $TAG)"
echo "   Pods:        k3s kubectl -n amdox get pods -w"
echo "   Certificate: k3s kubectl -n amdox get certificate     (Ready in 1–3 min)"
echo "   Rollback:    sudo ./rollback.sh"
echo "   Open:        https://$DOMAIN"

#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Amdox ERP — roll back a bad deploy.
#
#   sudo ./rollback.sh                 # undo the last deploy (all services)
#   sudo ./rollback.sh backend         # undo just the backend
#   sudo ./rollback.sh backend 18a1b39 # pin backend to a specific image tag
#   ./rollback.sh --history            # what's been deployed / available
#
# This works because deploy-k3s.sh tags images with the git SHA. Each deploy
# changes the Deployment's image field, so Kubernetes records a revision that
# `rollout undo` can return to. (With a fixed ":latest" tag it cannot.)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KUBECTL="k3s kubectl"
NS="amdox"
SERVICES=(backend frontend ml-service)

# ── History / available images ───────────────────────────────────────────────
if [[ "${1:-}" == "--history" || "${1:-}" == "-h" ]]; then
  echo "── Deploy history (newest last) ─────────────────────────"
  [[ -f "$HERE/.deploy-history" ]] && tail -15 "$HERE/.deploy-history" || echo "  (none recorded yet)"
  echo
  echo "── Images available on this node ────────────────────────"
  k3s ctr images ls -q | grep -E "amdox-(backend|frontend|ml)" | sed 's/^/  /' || echo "  (none)"
  echo
  echo "── Current running tags ─────────────────────────────────"
  for s in "${SERVICES[@]}"; do
    img=$($KUBECTL -n "$NS" get deploy "$s" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "n/a")
    printf "  %-12s %s\n" "$s" "$img"
  done
  echo
  echo "── Rollout revisions (backend) ──────────────────────────"
  $KUBECTL -n "$NS" rollout history deploy/backend 2>/dev/null || true
  exit 0
fi

TARGET="${1:-all}"
PIN_TAG="${2:-}"

# ── Pin a specific service to a specific tag ─────────────────────────────────
if [[ -n "$PIN_TAG" ]]; then
  if [[ "$TARGET" == "all" ]]; then
    echo "ERROR: specify a service when pinning a tag, e.g. ./rollback.sh backend 18a1b39" >&2
    exit 1
  fi
  # Deployment "ml-service" runs a container named "ml-service"; image repo differs.
  case "$TARGET" in
    backend)    REPO="amdox-backend" ;;
    frontend)   REPO="amdox-frontend" ;;
    ml-service) REPO="amdox-ml" ;;
    *) echo "ERROR: unknown service '$TARGET' (backend|frontend|ml-service)" >&2; exit 1 ;;
  esac
  echo "▶ Pinning $TARGET → $REPO:$PIN_TAG"
  $KUBECTL -n "$NS" set image "deploy/$TARGET" "$TARGET=$REPO:$PIN_TAG"
  $KUBECTL -n "$NS" rollout status "deploy/$TARGET" --timeout=180s
  echo "✅ $TARGET now running $REPO:$PIN_TAG"
  exit 0
fi

# ── Undo the last rollout ────────────────────────────────────────────────────
undo() {
  local svc="$1"
  echo "▶ Rolling back $svc…"
  if $KUBECTL -n "$NS" rollout undo "deploy/$svc" 2>/dev/null; then
    $KUBECTL -n "$NS" rollout status "deploy/$svc" --timeout=180s || true
    local img
    img=$($KUBECTL -n "$NS" get deploy "$svc" -o jsonpath='{.spec.template.spec.containers[0].image}')
    echo "✅ $svc → $img"
  else
    echo "⚠️  $svc: no previous revision to roll back to"
  fi
}

if [[ "$TARGET" == "all" ]]; then
  for s in "${SERVICES[@]}"; do undo "$s"; done
else
  undo "$TARGET"
fi

echo
echo "Current state:"
$KUBECTL -n "$NS" get pods

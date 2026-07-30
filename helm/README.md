# Amdox ERP — Helm Chart

Packages the whole stack (frontend, backend, ML, Postgres, Redis, ingress, TLS,
HPA) as a single Helm release — the parameterised equivalent of the raw manifests
in `k8s/`.

## Install / upgrade

```bash
# from repo root, on the k3s node (images already built + imported)
helm upgrade --install amdox ./helm/amdox-erp \
  --namespace amdox --create-namespace \
  --set domain=13.127.204.51.nip.io \
  --set letsencryptEmail=you@example.com \
  --set images.backend.tag=$(git rev-parse --short HEAD) \
  --set images.frontend.tag=$(git rev-parse --short HEAD) \
  --set images.ml.tag=$(git rev-parse --short HEAD) \
  --set secrets.DB_PASSWORD=$(openssl rand -hex 16) \
  --set secrets.JWT_SECRET=$(openssl rand -hex 32) \
  --set secrets.JWT_REFRESH_SECRET=$(openssl rand -hex 32)
```

> Secrets can also live in a private, git-ignored `secrets.values.yaml` passed with `-f`.
> Note: Postgres only reads `DB_PASSWORD` on first init — keep it stable across upgrades.

## Common operations

```bash
helm template amdox ./helm/amdox-erp        # render manifests locally (dry run)
helm lint ./helm/amdox-erp                  # validate the chart
helm status amdox -n amdox                  # release status
helm rollback amdox -n amdox                # roll back to the previous release
helm uninstall amdox -n amdox               # tear down (keeps PVCs)
```

## What you can tune (`values.yaml`)

| Key | Purpose |
|---|---|
| `domain`, `letsencryptEmail` | public host + TLS |
| `images.*.tag` | deploy a specific build (use the git SHA) |
| `backend.replicas`, `frontend.replicas` | scale out |
| `hpa.*` | autoscaling bounds |
| `ml.enabled` | turn the ML service off on tiny nodes |
| `postgres.storage` | PVC size |
| `secrets.*` | DB / JWT / Gmail credentials |

## Relationship to `k8s/deploy-k3s.sh`
The shell script and this chart deploy the same topology. The script is the
zero-dependency path (builds images + applies raw manifests); the Helm chart is
the packaged, versioned, rollback-friendly path preferred for repeatable installs.

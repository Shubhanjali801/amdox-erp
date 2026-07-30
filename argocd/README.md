# ArgoCD — GitOps Continuous Delivery

Amdox ERP can be delivered two ways:

| Path | How | When to use |
|------|-----|-------------|
| **Imperative** (`k8s/deploy-k3s.sh`) | build images on the node → import into k3s → `kubectl apply` | quick single-box demo; no registry needed |
| **GitOps** (this folder) | ArgoCD watches the Helm chart in git and syncs the cluster; CI pushes images to Docker Hub | production-style CD; the state of the cluster is whatever is in git |

The GitOps loop:

```
merge to main
   → .github/workflows/build.yml  builds & pushes  <user>/amdox-erp-{backend,frontend}:<sha>
   → ArgoCD Image Updater         detects the new tag, writes it into helm values in git
   → ArgoCD                       syncs the cluster to match git  → rolling update
```

Nobody runs `kubectl` by hand, and the cluster self-heals any manual drift back to git.

## One-time install

```bash
# 1. Install ArgoCD into the cluster
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 2. (optional but recommended) Install ArgoCD Image Updater for the auto-tag loop
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj-labs/argocd-image-updater/stable/manifests/install.yaml

# 3. Get the initial admin password + open the UI
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d; echo
kubectl -n argocd port-forward svc/argocd-server 8080:443
#   → https://localhost:8080  (user: admin)
```

## Register this app

1. Edit `argocd/application.yaml` and replace **`GITHUB_USER`** (repo owner) and
   **`DOCKER_USER`** (Docker Hub account from `build.yml`).
2. Create the runtime secret out-of-band (kept out of git — this is why the
   Application sets `secrets.managed=false`):

   ```bash
   kubectl create namespace amdox --dry-run=client -o yaml | kubectl apply -f -
   kubectl -n amdox create secret generic amdox-secrets \
     --from-literal=DATABASE_URL="postgresql://amdox:<PW>@postgres:5432/amdox_erp" \
     --from-literal=REDIS_URL="redis://redis:6379" \
     --from-literal=JWT_SECRET="<32+ char secret>" \
     --from-literal=JWT_REFRESH_SECRET="<32+ char secret>" \
     --from-literal=POSTGRES_PASSWORD="<PW>" \
     --from-literal=GMAIL_USER="" \
     --from-literal=GMAIL_APP_PASSWORD=""
   ```

   > In a real cluster use **sealed-secrets** or **external-secrets** so even the
   > encrypted secret can live in git safely. Plain `kubectl create secret` is
   > fine for the demo.

3. Apply the Application and watch it sync:

   ```bash
   kubectl apply -f argocd/application.yaml
   kubectl -n argocd get application amdox-erp -w
   ```

ArgoCD will render the Helm chart, create everything in the `amdox` namespace,
and stay green. Push a change to `main` and watch it roll out on its own.

## Notes & honest caveats

- **Registry required.** GitOps pulls images from Docker Hub, so `build.yml`
  (needs `DOCKER_USERNAME` / `DOCKER_TOKEN` repo secrets) must be green. The
  on-node `deploy-k3s.sh` path does not use a registry and is unaffected.
- **Image Updater `newest-build`** orders images by build timestamp from the
  registry — works with the `:<sha>` tags `build.yml` pushes. If you prefer,
  drop Image Updater and let `build.yml` commit the new tag into `values.yaml`
  itself; ArgoCD will still sync.
- **`secrets.managed=false`** keeps credentials out of git. If you ever set it
  `true`, pass real values via a private, un-committed values file — never the
  `change_me` placeholders.

# Amdox ERP — Self-Hosted Kubernetes (k3s) Deployment

Real, self-hosted Kubernetes on **one VM** using **k3s** (lightweight K8s with built-in
Traefik ingress). Everything runs in-cluster: Postgres, Redis, backend, frontend, ML.

## Recommended VM
- **Oracle Cloud Always-Free** ARM VM (4 cores / 24 GB RAM) — free, fits PyTorch.
- or **Hetzner CPX21** (~€5/mo). Min for full stack incl. ML: ~4 GB RAM (8 GB comfortable).

---

## Step 0 — Point a domain at the VM
- Get the VM's public IP. Create an **A record** for `<DOMAIN>` → that IP.
- Free option: **DuckDNS** (`yourname.duckdns.org`).

## Step 1 — Install k3s (on the VM)
```bash
curl -sfL https://get.k3s.io | sh -
# kubectl is now available as: sudo k3s kubectl
sudo k3s kubectl get nodes        # should show the node Ready
# (optional) copy kubeconfig so plain `kubectl` works:
mkdir -p ~/.kube && sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config && sudo chown $USER ~/.kube/config
```
k3s ships **Traefik** ingress + a local-path StorageClass (for the Postgres PVC) out of the box.

## Step 2 — Install cert-manager (for free HTTPS)
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
kubectl -n cert-manager rollout status deploy/cert-manager-webhook
```

## Step 3 — Build & push images (from your dev machine)
Replace `<REGISTRY>` with your Docker Hub username everywhere.
```bash
docker login

docker build -t <REGISTRY>/amdox-backend:latest backend
docker push <REGISTRY>/amdox-backend:latest

docker build --build-arg VITE_API_BASE_URL=https://<DOMAIN>/api/v1 \
             -t <REGISTRY>/amdox-frontend:latest frontend
docker push <REGISTRY>/amdox-frontend:latest

docker build -t <REGISTRY>/amdox-ml:latest ml-service   # optional, heavy
docker push <REGISTRY>/amdox-ml:latest
```
Then edit the `image:` lines in `04-backend.yaml`, `05-frontend.yaml`, `06-ml-service.yaml`.

## Step 4 — Fill in placeholders
- `01-config.yaml`: replace `<DOMAIN>`
- `07-ingress.yaml`: replace `<DOMAIN>` and `<EMAIL>`
- Create the secret (don't commit real values):
```bash
kubectl create namespace amdox
kubectl -n amdox create secret generic amdox-secrets \
  --from-literal=DATABASE_URL='postgresql://amdox:STRONGPASS@postgres:5432/amdox_erp' \
  --from-literal=REDIS_URL='redis://redis:6379' \
  --from-literal=JWT_SECRET="$(openssl rand -hex 32)" \
  --from-literal=JWT_REFRESH_SECRET="$(openssl rand -hex 32)" \
  --from-literal=POSTGRES_PASSWORD='STRONGPASS' \
  --from-literal=GMAIL_USER='you@gmail.com' \
  --from-literal=GMAIL_APP_PASSWORD='xxxxxxxxxxxxxxxx'
```
(If you used the CLI secret above, skip the Secret block in `01-config.yaml`.)

## Step 5 — Deploy everything
```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-config.yaml      # ConfigMap (+ Secret if using YAML)
kubectl apply -f k8s/02-postgres.yaml
kubectl apply -f k8s/03-redis.yaml
kubectl apply -f k8s/04-backend.yaml
kubectl apply -f k8s/05-frontend.yaml
kubectl apply -f k8s/06-ml-service.yaml  # optional
kubectl apply -f k8s/07-ingress.yaml

kubectl -n amdox get pods -w            # watch them go Ready
```
The backend auto-runs `prisma migrate deploy` on start (its Dockerfile CMD).

## Step 6 — Seed demo data (once)
```bash
kubectl -n amdox exec deploy/backend -- npx ts-node src/db/seeds/seed-forecast-data.ts
```

## Step 7 — Verify
- `https://<DOMAIN>/api/v1/health/live` → ok
- `https://<DOMAIN>` → the app (register → login → use it)
- TLS padlock should appear within ~1–2 min (cert-manager issues the cert)

---

## Useful ops commands
```bash
kubectl -n amdox get pods                 # status
kubectl -n amdox logs deploy/backend -f   # backend logs
kubectl -n amdox rollout restart deploy/backend
kubectl -n amdox scale deploy/backend --replicas=3   # manual scale
```

## What this demonstrates (for the report)
- Real Kubernetes (k3s) — Deployments, StatefulSet (Postgres + PVC), Services, Ingress
- Self-healing (liveness/readiness probes), 2-replica HA for backend/frontend
- Rolling deploys, TLS via cert-manager, in-cluster service discovery
- True self-hosted infra — no managed PaaS

> For a lighter alternative (managed PaaS, no server to run), see `docs/DEPLOYMENT.md`
> (Railway + Vercel + Supabase + Upstash).

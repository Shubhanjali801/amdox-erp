# Amdox ERP — AWS Deployment (k3s + HTTPS)

Deploys the full stack (frontend, backend, ml-service, Postgres, Redis) to a
**single AWS EC2 instance running k3s** (lightweight Kubernetes), with automatic
**HTTPS** via Traefik + cert-manager + Let's Encrypt on a custom domain.

This satisfies the spec's Kubernetes/Helm-style orchestration on AWS without the
cost/complexity of EKS + Aurora + ElastiCache.

```
Internet ──443/80──► EC2 (t3.large, Ubuntu 22.04, k3s)
                       ├─ Traefik ingress  (/api → backend, / → frontend, TLS)
                       ├─ frontend (nginx, 2 replicas)
                       ├─ backend  (Express+Prisma, 2 replicas)
                       ├─ ml-service (FastAPI+PyTorch)
                       ├─ postgres (StatefulSet + PVC)
                       └─ redis
```

---

## Step 1 — Launch the EC2 instance

AWS Console → EC2 → **Launch instance**:

| Setting | Value |
|---|---|
| Name | `amdox-erp` |
| AMI | **Ubuntu Server 22.04 LTS** (64-bit x86) |
| Instance type | **t3.large** (2 vCPU, 8 GB) — needed for the PyTorch build/runtime |
| Key pair | create/download `amdox-key.pem` (for SSH) |
| Storage | **30 GB gp3** |

**Security group** — allow inbound:
| Type | Port | Source |
|---|---|---|
| SSH | 22 | My IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

After launch → **Elastic IP** → Allocate → Associate with the instance
(so the public IP is stable across reboots). Note the IP, e.g. `13.200.x.x`.

---

## Step 2 — Point your domain at the instance

In your DNS (amdox.in registrar) add an **A record**:

```
erp.amdox.in.   A   13.200.x.x     (your Elastic IP)
```

Verify it resolves (may take a few minutes):
```bash
nslookup erp.amdox.in
```
> cert-manager needs this working before it can issue the TLS cert.

---

## Step 3 — SSH in and install Docker + k3s

```bash
ssh -i amdox-key.pem ubuntu@13.200.x.x

# Docker (used to build images)
sudo apt-get update && sudo apt-get install -y docker.io git
sudo usermod -aG docker ubuntu && newgrp docker

# k3s (single-node Kubernetes; ships Traefik + metrics-server)
curl -sfL https://get.k3s.io | sh -
sudo k3s kubectl get nodes          # should show the node Ready
```

---

## Step 4 — Get the code + fill in secrets

```bash
git clone <YOUR_REPO_URL> amdox-erp        # or scp the project up
cd amdox-erp/k8s
cp deploy.env.example deploy.env
nano deploy.env                            # set DOMAIN, LETSENCRYPT_EMAIL,
                                           # DB_PASSWORD, JWT secrets, Gmail creds
#   generate a secret:  openssl rand -hex 32
```

---

## Step 5 — Deploy (one command)

```bash
cd amdox-erp/k8s
chmod +x deploy-k3s.sh
sudo -E ./deploy-k3s.sh
```

This builds the 3 images, imports them into k3s, creates config/secrets,
applies all workloads, installs cert-manager, and applies the ingress + TLS issuer.

Watch it come up:
```bash
sudo k3s kubectl -n amdox get pods -w
sudo k3s kubectl -n amdox get certificate    # amdox-tls → Ready in 1–3 min
```

Backend auto-runs `prisma migrate deploy` on start, so the schema is created
automatically.

---

## Step 6 — Seed demo data (optional but recommended for the demo)

```bash
# exec into a running backend pod and run the seeders
POD=$(sudo k3s kubectl -n amdox get pod -l app=backend -o jsonpath='{.items[0].metadata.name}')
sudo k3s kubectl -n amdox exec -it "$POD" -- npx prisma db seed
```

---

## Step 7 — Verify

Open **https://erp.amdox.in** — you should get the landing page with a valid
padlock (Let's Encrypt cert). Log in / register a tenant and walk the modules.

Health check:
```bash
curl https://erp.amdox.in/api/v1/health/live
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Pod `ImagePullBackOff` | image not imported — re-run steps 1–2 of the script, ensure `imagePullPolicy: IfNotPresent` |
| Cert stuck `not Ready` | DNS A-record not propagated, or port 80 blocked — Let's Encrypt HTTP-01 needs `:80` open |
| Backend `CrashLoopBackOff` | check logs: `k3s kubectl -n amdox logs deploy/backend`; usually DB not ready — it retries |
| ML pod OOM | node too small — use t3.large+; the app degrades gracefully without ml-service |
| 502 from ingress | backend not ready yet; `k3s kubectl -n amdox get pods` |

## Cost control
`t3.large` ≈ $0.08/hr. **Stop** the instance when not demoing (Elastic IP keeps
the address). Terminate + release the Elastic IP when fully done.

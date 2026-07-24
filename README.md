# Amdox ERP — AI-Powered Cloud ERP Suite

**Project Code:** AMX-ERP-2026 | **Version:** 1.0

> A multi-tenant, AI-augmented ERP platform unifying finance, supply chain, HR & payroll, project tracking, and business intelligence — with role-based access control and machine-learning demand forecasting.

---

## 🌐 Live Demo

**URL:** https://13.127.204.51.nip.io/
Deployed on **AWS EC2** running **Kubernetes (k3s)** with **Let's Encrypt HTTPS**.

### Demo Accounts (role-based access)

| Login | Password | What they can access |
|---|---|---|
| `admin@amdox.com` | `Admin@1234` | **Everything** — all modules + settings |
| `finance@amdox.com` | `Finance@1234` | **Finance only** |
| `hr@amdox.com` | `HR@1234` | **HR & Payroll only** |
| `supply@amdox.com` | `Supply@1234` | **Supply Chain only** |
| `pm@amdox.com` | `PM@1234` | **Projects only** |
| `viewer@amdox.com` | `Viewer@1234` | Read-only, all modules |

> 💡 **Try the RBAC:** log in as `finance@amdox.com` — the sidebar shows **only Finance**. Log in as `hr@amdox.com` — **only HR & Payroll**. Access is enforced at both the **API** (403) and the **UI** (hidden menus + guarded routes).

---

## Overview

Amdox ERP consolidates fragmented enterprise workflows into one platform. Every request is scoped to a **tenant** (company), and every endpoint is guarded by **granular permissions**, so multiple companies and multiple roles safely share one deployment.

**By the numbers:**

| | |
|---|---|
| Database tables | **43** (+ 28 enums) |
| REST endpoints | **~120** |
| Backend source files | **216** |
| Frontend source files | **115** |
| ML forecast accuracy | **12.84% MAPE** (LSTM) |

---

## Key Features

### 💰 Finance
General ledger (double-entry), Accounts Payable & Receivable with `DRAFT → APPROVED → PAID` lifecycle, payments that auto-update invoice status, multi-currency with FX rates, financial reports.

### 👥 HR & Payroll
Employee records, departments, attendance (clock in/out, WFH), leave requests with approve/reject, payroll runs with gross-to-net payslips.

### 📦 Supply Chain
Vendors, inventory with SKU + stock levels and reorder points, purchase orders (`DRAFT → SENT → RECEIVED`) where goods receipt **auto-updates stock**, stock movement history.

### 📋 Projects
Projects, milestones, tasks, resource allocation, budget tracking.

### 📊 Dashboard & BI
Live KPI cards computed from real data, charts (Recharts), configurable widgets, scheduled reports.

### 🔐 Security
- **JWT** auth — 15 min access token + 7 day refresh with **rotation**
- **MFA (TOTP)** — authenticator-app two-factor
- **RBAC** — permission guards (`resource:action`) on every route
- **Multi-tenant isolation** — every query filtered by `tenantId`
- **Hash-chained audit log** — tamper-evident (F-09)
- Password reset via email, bcrypt hashing, Zod validation

### 🤖 AI / ML
Demand forecasting microservice (Python FastAPI):
- **LSTM** (PyTorch) — **12.84% MAPE**
- **Prophet** (Meta) — captures trend + seasonality, validated with a holdout back-test

> Demo it on inventory item **`FORECAST-DEMO-001`** (seeded with 18 months of sales history).

---

## Role-Based Access Control

Permissions follow a `resource:action` model, resolved from the user's roles at login and signed into the JWT.

**Resources:** `finance`, `hr`, `supply_chain`, `project`, `dashboard`, `report`, `user`, `settings`, `audit`
**Actions:** `create`, `read`, `update`, `delete`, `approve`, `export`, `run_payroll`

**Enforcement flow:**
```
POST /api/v1/finance/ap/:id/approve
 → authenticate                      (valid JWT?)           → 401
 → requirePermission('finance:approve')                     → 403
 → validate(schema)                                         → 400
 → controller reads req.user.tenantId
 → service: prisma.invoice.findFirst({ where: { id, tenantId } })   ← tenant isolation
```

**Seeded roles:** `super_admin`, `tenant_admin`, `manager`, `viewer`, plus department-scoped `finance_manager`, `hr_manager`, `supply_chain_manager`, `project_manager`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, TypeScript, Tailwind CSS, TanStack Query, Zustand, React Hook Form + Zod, Recharts |
| **Backend** | Node.js 22, **Express 4**, TypeScript, Prisma 5.22 |
| **Database** | PostgreSQL 17 |
| **Cache / Sessions** | Redis 7 |
| **ML Service** | Python 3.11, FastAPI, PyTorch (LSTM), Prophet, pandas, scikit-learn |
| **Auth** | JWT (access + refresh), bcrypt, TOTP MFA (speakeasy) |
| **Containers** | Docker (multi-stage builds) |
| **Orchestration** | Kubernetes (**k3s**), Traefik ingress, cert-manager + Let's Encrypt, HPA |
| **Cloud** | AWS EC2 + EBS + Elastic IP + Security Groups |
| **Observability** | Prometheus (`/metrics` via prom-client), Grafana |
| **CI/CD** | GitHub Actions |
| **Testing** | Vitest, Playwright, k6 (load) |

> **Deviations from the original spec** (deliberate, for scope/cost): **Express** instead of NestJS; **Vite + React** instead of Next.js; **JWT + bcrypt** instead of Keycloak; **k3s on EC2** instead of managed EKS + RDS + ElastiCache. The Kubernetes manifests and architecture mirror the spec's production design.

---

## Architecture

```
                    ┌──────────────────────────────────────────────┐
Internet ──443/80──►│  AWS EC2 (Ubuntu 22.04) — k3s Kubernetes     │
   (HTTPS)          │                                              │
                    │  Traefik Ingress  +  cert-manager (TLS)      │
                    │        │                                     │
                    │        ├── /  ──────► frontend (nginx ×2)    │
                    │        └── /api ────► backend (Express ×2)   │
                    │                          │                   │
                    │                          ├──► postgres (PVC) │
                    │                          ├──► redis          │
                    │                          └──► ml-service     │
                    │                               (FastAPI)      │
                    └──────────────────────────────────────────────┘
```

**Request path:** `Route → authenticate → requirePermission → validate(Zod) → Controller → Service → Prisma (tenant-scoped)`

Full design: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) · Database: [docs/DB_SCHEMA.md](./docs/DB_SCHEMA.md) · API: [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)

---

## Local Development

### Prerequisites
Node.js ≥ 20 · Docker Desktop · Python 3.11 (for the ML service) · Git

### 1. Clone
```bash
git clone https://github.com/Shubhanjali801/amdox-erp.git
cd amdox-erp
```

### 2. Start infrastructure (PostgreSQL + Redis)
```bash
docker-compose up -d
```

### 3. Backend
```bash
cd backend
cp .env.example .env        # set DATABASE_URL, REDIS_*, JWT secrets
npm install
npm run migrate             # apply Prisma migrations
npm run seed                # demo tenant, roles, users, sample data
npm run dev                 # http://localhost:5000
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:3000
```

### 5. ML service (optional — needed for forecasting)
```bash
cd ml-service
pip install -r requirements.txt
python run.py               # http://localhost:8000  (docs at /docs)
```

**Endpoints:** App `http://localhost:3000` · API `http://localhost:5000` · Swagger `http://localhost:5000/api-docs` · ML `http://localhost:8000/docs`

---

## Deployment (AWS + Kubernetes)

The full stack deploys to a **single EC2 instance running k3s**, with automatic HTTPS.

```bash
# on the server
git clone https://github.com/Shubhanjali801/amdox-erp.git && cd amdox-erp/k8s
cp deploy.env.example deploy.env    # set DOMAIN, secrets
sudo ./deploy-k3s.sh                # builds images → imports to k3s → applies manifests → TLS
```

`deploy-k3s.sh` handles: image builds, k3s import, config/secrets, Postgres/Redis/backend/frontend/ml workloads, cert-manager, and the Traefik ingress with Let's Encrypt.

📖 Step-by-step guide: **[docs/AWS_K3S_DEPLOYMENT.md](./docs/AWS_K3S_DEPLOYMENT.md)**

**Kubernetes manifests** (`k8s/`): namespace, config/secrets, Postgres StatefulSet + PVC, Redis, backend (2 replicas + probes), frontend, ml-service, Traefik ingress + cert-manager, **HPA**, Prometheus/Grafana monitoring, pg_dump backup CronJob.

---

## Project Structure

```
amdox-erp/
├── frontend/         # React + Vite + TypeScript
├── backend/          # Express + Prisma + TypeScript
│   ├── src/routes/       # route definitions + permission guards
│   ├── src/controllers/  # request handling
│   ├── src/services/     # business logic (tenant-scoped)
│   ├── src/middleware/   # authenticate, requirePermission, validate
│   └── prisma/           # schema + migrations
├── ml-service/       # Python FastAPI + LSTM + Prophet
├── k8s/              # Kubernetes manifests + deploy-k3s.sh
├── docs/             # architecture, API, deployment, UML
├── tests/load/       # k6 load test
└── .github/workflows # CI/CD
```

---

## Testing

```bash
cd backend  && npm test        # unit / integration
cd frontend && npm test        # Vitest
k6 run tests/load/k6-script.js # load test — 2000 VUs, P95 < 300ms
```

---

## Non-Functional Targets

| Metric | Target |
|---|---|
| Uptime | 99.9% monthly |
| API latency | < 300 ms P95 |
| Concurrent users | ≥ 2,000 per tenant |
| Data durability | RPO < 15 min (pg_dump CronJob) |
| Scalability | Kubernetes HPA (scale at >70% CPU) |
| Security | OWASP Top 10 aligned, RBAC + zero-trust, GDPR-ready |

---

## Team

| Member | Role | Modules |
|---|---|---|
| M1 | DevOps & Infrastructure | Docker, CI/CD, Deployment |
| M2 | Auth & Backend Core | Auth, Multi-tenancy, RBAC |
| M3 | Finance | GL, AP/AR, Currency |
| M4 | HR & Project Management | Employees, Payroll, Projects |
| M5 | Supply Chain + AI/ML | PO, Inventory, Forecasting, Notifications |
| M6 | Frontend + BI + QA | Dashboard, Charts, Testing |

---

*Amdox Technologies — Engineering Division*

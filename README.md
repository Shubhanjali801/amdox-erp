# Amdox ERP — AI-Powered Cloud ERP Suite

**Project Code:** AMX-ERP-2026-06 | **Version:** 1.0 | **June 2026**

> A scalable, AI-augmented, multi-tenant ERP platform delivering financial management, supply chain automation, HR & payroll, project tracking, and business intelligence.

---

## Team Members

| Member | Role | Modules |
|--------|------|---------|
| M1 | DevOps & Infrastructure | Docker, CI/CD, Deployment |
| M2 | Auth & Backend Core | Auth, Multi-tenancy, RBAC |
| M3 | Finance | GL, AP/AR, Currency |
| M4 | HR & Project Management | Employees, Payroll, Gantt |
| M5 | Supply Chain + AI/ML | PO, Inventory, Forecasting, Notifications |
| M6 | Frontend + BI + QA | Dashboard, Charts, Testing |

---

## Prerequisites

- Node.js >= 20.0.0
- Docker Desktop
- Git

---

## Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/Shubhanjali801/amdox-erp.git
cd amdox-erp
```

### 2. Setup environment variables
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start infrastructure (PostgreSQL 17, Redis, Keycloak, Elasticsearch)
```bash
docker-compose up -d
```

### 4. Install dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 5. Run database migrations & seeds
```bash
cd backend
npm run migrate
npm run seed
```

### 6. Start development servers
```bash
# From project root
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Docs (Swagger):** http://localhost:5000/api-docs
- **pgAdmin (DB UI):** http://localhost:8081
- **Redis UI:** http://localhost:8082
- **Keycloak Admin:** http://localhost:8080

---

## Project Structure

```
amdox-erp/
├── frontend/        # React + Vite + TypeScript
├── backend/         # Node.js + NestJS + TypeScript
├── docs/            # Architecture, API docs, guides
├── .github/         # CI/CD workflows
├── docker-compose.yml
└── .env.example
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run dev:frontend` | Start frontend only |
| `npm run dev:backend` | Start backend only |
| `npm run build` | Build all packages |
| `npm run test` | Run all tests |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full system design.

---

## Target SLA

- **Uptime:** 99.9% monthly
- **API Latency:** < 300ms P95
- **Concurrent Users:** >= 2,000 per tenant
- **Security:** OWASP Top 10 + SOC 2 aligned
- **Compliance:** GDPR + ISO 27001

---

*Amdox Technologies — Engineering Division — June 2026*

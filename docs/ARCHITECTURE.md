# Amdox ERP — Architecture Overview

## Project Code: AMX-ERP-2026-04

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| UI Library | Tailwind CSS + shadcn/ui |
| State Management | Zustand + React Query |
| Backend | Node.js 22 + NestJS 11 + TypeScript |
| Database | PostgreSQL 17 + Prisma ORM |
| Cache | Redis 7 |
| Auth | Keycloak 25 (OIDC/SAML) + JWT |
| Search | Elasticsearch 8 |
| Queue | BullMQ (Redis-backed) |
| File Storage | AWS S3 |
| Email | AWS SES |
| CI/CD | GitHub Actions |
| Containers | Docker + Docker Compose |

---

## System Layers

```
Client (React SPA)
      ↓ HTTPS REST/JSON
NestJS API Gateway (Node.js 22)
      ↓ Prisma ORM
PostgreSQL 17 + Redis 7 + Elasticsearch 8
      ↓ BullMQ Jobs
Background Workers (Email, Payroll, Webhooks)
      ↓ HTTP
ML Microservice (Python FastAPI)
```

---

## Module Ownership

| Module | Member | Key Files |
|--------|--------|-----------|
| DevOps & Infra | M1 | docker-compose, CI/CD, scripts |
| Auth & Core | M2 | auth, users, tenants, RBAC |
| Finance | M3 | GL, AP, AR, Currency |
| HR & Projects | M4 | Employees, Payroll, Gantt |
| Supply Chain + AI | M5 | PO, Inventory, Forecasting, Notifications |
| Frontend + BI + QA | M6 | Dashboard, Charts, Tests |

---

## Key Design Patterns

- **Controller → Service → Repository**: Clean separation of concerns
- **Event-Driven**: Domain events via EventEmitter for cross-module communication
- **Outbox Pattern**: Guaranteed event delivery via DB + BullMQ
- **RBAC**: Role-based access control with tenant isolation
- **Repository Pattern**: All DB access via repository layer

---

## API Structure

```
/api/v1/auth/*          → M2
/api/v1/users/*         → M2
/api/v1/tenants/*       → M2
/api/v1/finance/*       → M3
/api/v1/hr/*            → M4
/api/v1/projects/*      → M4
/api/v1/supply-chain/*  → M5
/api/v1/notifications/* → M5
/api/v1/dashboard/*     → M6
/api/v1/reports/*       → M6
/api/v1/settings/*      → M2
```

---

## Environments

| Environment | URL | Trigger |
|-------------|-----|---------|
| Development | localhost:3000 | Manual |
| Staging | staging.amdox-erp.com | Merge to dev |
| Production | app.amdox-erp.com | Tagged release |

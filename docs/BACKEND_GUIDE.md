Here's the step-by-step backend build process for your documentation:

---

# 🔧 Backend — Step-by-Step Build Process

## PHASE 1 — Project Initialization

```bash
# 1. Create backend folder structure
amdox-erp/backend/
├── src/
│   ├── config/         # database, env, cors, redis, swagger
│   ├── controllers/    # request handlers
│   ├── services/       # business logic
│   ├── routes/         # URL definitions
│   ├── middleware/     # auth, validation, error handling
│   ├── validators/     # Joi input schemas
│   ├── utils/          # logger, response helpers, errors
│   └── db/seeds/       # demo data
├── prisma/             # schema + migrations
└── package.json

# 2. Install dependencies
cd backend
npm install
```

---

## PHASE 2 — Database Layer (Prisma + PostgreSQL)

```bash
# 1. Write the schema (43 tables + 28 enums)
backend/prisma/schema.prisma

# 2. Start PostgreSQL via Docker
docker-compose up -d

# 3. Validate schema
npx prisma validate

# 4. Create tables (migration)
npm run migrate:dev          # → npx prisma migrate dev

# 5. Generate the typed Prisma client
npm run prisma:generate

# 6. Seed demo data
npm run seed
```

---

## PHASE 3 — Core Setup (config + middleware)

```
1. config/env.ts        → central env-var reader
2. config/database.ts   → Prisma client connection
3. config/redis.ts      → Redis connection (BullMQ)
4. config/cors.ts       → CORS allowlist
5. middleware/
   - auth.middleware.ts        → JWT verify + RBAC guards
   - validation.middleware.ts  → Joi validation
   - errorHandler.middleware   → centralized errors
   - rateLimiter.middleware    → request throttling
6. utils/
   - logger.ts          → Winston logging
   - response.ts        → sendSuccess / sendError / sendPaginated
   - errors.ts          → custom error classes
```

---

## PHASE 4 — Build Each Module (the repeatable pattern)

For **every** module, the same 5 layers:

```
1. services/<module>Service.ts     → logic + Prisma queries
2. controllers/<module>Controller  → handle req/res
3. validators/<module>.validator   → Joi input rules
4. routes/<module>Routes.ts        → URLs + auth + RBAC + validation
5. Register in routes/index.ts     → mount under /api/v1
```

**Modules built (in order):**
```
✅ Auth      → register, login, refresh, logout, me, change-password
✅ Users     → CRUD + pagination + search
✅ Tenants   → get, update
✅ Finance Ledger → Chart of Accounts CRUD
✅ Supply/ML → forecast generate (calls Python ML)
```

---

## PHASE 5 — Authentication & Security

```
1. JWT tokens         → access (15min) + refresh (7d)
2. Password hashing   → bcrypt (12 rounds)
3. RBAC               → roles + permissions baked into JWT
4. Multi-tenancy      → tenantId scoping on every query
5. Sessions           → refresh token rotation
6. Audit logging      → every login/action recorded
7. Validation         → Joi schemas, field-level errors
```

---

## PHASE 6 — ML Integration

```
1. services/external/mlService.ts        → HTTP client (axios) → Python :8000
2. services/supplyChain/forecastingService → DB → ML → DB orchestration
3. controllers + routes                   → /supply/forecasts endpoints
```

```
Flow: Read sales history (PostgreSQL)
        → POST to Python ML service
        → Save prediction back to Forecast table
```

---

## PHASE 7 — API Documentation

```
1. Install swagger-ui-express
2. config/swagger.ts        → OpenAPI 3.0 spec
3. Mount at /api-docs       → interactive Swagger UI
```

---

## PHASE 8 — Run & Test

```bash
# Start everything
docker-compose up -d         # infra
npm run dev                  # backend → :5000

# Verify
http://localhost:5000/api-docs       # Swagger
http://localhost:5000/api/v1/health/live

# Test in Postman: register → login → use token on protected routes
```

---

## 🛠️ Key Commands Reference

| Command | Purpose |
|---------|---------|
| `docker-compose up -d` | Start PostgreSQL, Redis, etc. |
| `npm run dev` | Run backend (:5000) |
| `npm run migrate:dev` | Create/update tables |
| `npm run prisma:generate` | Regenerate client |
| `npm run seed` | Insert demo data |
| `npx prisma studio` | Visual DB browser |
| `npx prisma validate` | Check schema |

---

## 🏗️ Request Flow (the architecture)

```
Client
  ↓
routes/        → URL + authenticate + requirePermission + validate
  ↓
controllers/   → parse req, call service, format response
  ↓
services/      → business logic + Prisma queries
  ↓
PostgreSQL   +   Python ML service (HTTP)
```

---

## 📋 Tech Stack Summary

| Layer | Tech |
|-------|------|
| Runtime | Node.js + TypeScript |
| Framework | Express 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL 17 |
| Auth | JWT + bcrypt + RBAC |
| Validation | Joi |
| Queue | BullMQ + Redis |
| Docs | Swagger (OpenAPI) |
| ML | HTTP → Python FastAPI |

---


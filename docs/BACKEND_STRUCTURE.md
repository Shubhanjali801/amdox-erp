# Amdox ERP — Backend Folder Structure

> A guide to what every folder and file in `backend/` does.
> Stack: Node.js + TypeScript + Express + Prisma + PostgreSQL.

---

## Root-Level Folders

| Folder | Description |
|--------|-------------|
| `node_modules/` | Installed npm dependencies (auto-generated, git-ignored) |
| `prisma/` | Database schema (`schema.prisma`) + migration history. Defines all 43 tables & 28 enums |
| `scripts/` | Helper/setup scripts (branch setup, DB utilities) |
| `src/` | All application source code (TypeScript) |
| `tests/` | Unit, integration & E2E tests (Jest) |

## Root-Level Files

| File | Description |
|------|-------------|
| `.dockerignore` | Files Docker excludes from the build context |
| `.env` | Environment variables (DB URL, JWT secret, etc.) — git-ignored |
| `.eslintrc.json` | ESLint rules (code-style enforcement) |
| `.gitignore` | Files git excludes from version control |
| `.prettierrc` | Prettier formatting config |
| `Dockerfile` | Multi-stage build to containerize the backend |
| `jest.config.js` | Jest test runner configuration |
| `package.json` | Dependencies + npm scripts (dev, build, migrate, seed) |
| `tsconfig.json` | TypeScript compiler configuration |

---

## `src/` — Source Code (the core)

| Folder / File | Description |
|---------------|-------------|
| `common/` | Shared helpers/constants used across modules |
| `config/` | Configuration: `database.ts` (Prisma), `env.ts` (env vars), `cors.ts`, `redis.ts`, `swagger.ts`, `keycloak.ts` |
| `controllers/` | HTTP request handlers — read the request, call a service, send the response |
| `db/` | Database seeds (demo/initial data scripts) |
| `events/` | Event emitters (e.g. `user.created` → trigger email) |
| `jobs/` | Background jobs via BullMQ (payroll, email, forecasting, webhooks) |
| `middleware/` | Runs before controllers: `auth` (JWT + RBAC), `validation` (Joi), `errorHandler`, `rateLimiter`, `requestLogger` |
| `repositories/` | Reusable data-access helpers (base CRUD patterns over Prisma) |
| `routes/` | Maps URLs → controllers + applies middleware. `index.ts` mounts everything under `/api/v1` |
| `services/` | Business logic + Prisma queries (the "brain" — where work happens) |
| `types/` | Shared TypeScript type definitions / interfaces |
| `utils/` | Helpers: `logger` (Winston), `response` (success/error formatters), `errors` (custom error classes) |
| `validators/` | Joi input-validation schemas per module |
| `index.ts` | App entry point — boots Express, connects DB/Redis, mounts routes & Swagger |

---

## How They Work Together (request flow)

```
index.ts  (starts server)
   |
routes/        -> which URL + auth + RBAC + validation
   |
middleware/    -> security checkpoints (auth, validate)
   |
controllers/   -> translate request <-> response
   |
services/      -> business logic + database
   |
repositories/ + prisma -> PostgreSQL
   |
   |-- jobs/    -> async background work (BullMQ + Redis)
   '-- events/  -> side-effects (notifications)
```

---

## Folder Purpose at a Glance

```
config/       = settings & connections
routes/       = "WHERE" (URLs)
middleware/   = "WHO can access" (auth/RBAC)
validators/   = "WHAT is valid" (input rules)
controllers/  = "TRANSLATE" (req <-> res)
services/     = "DO THE WORK" (logic + DB)
repositories/ = "DATA ACCESS" (query helpers)
utils/        = "TOOLS" (logger, helpers)
jobs/         = "BACKGROUND WORK"
events/       = "SIDE EFFECTS"
db/           = "SEED DATA"
types/        = "TYPE DEFINITIONS"
```

---

## The 5-Layer Pattern (every module follows this)

```
1. services/<module>Service.ts     -> logic + Prisma queries
2. controllers/<module>Controller  -> handle req/res
3. validators/<module>.validator   -> Joi input rules
4. routes/<module>Routes.ts        -> URLs + auth + RBAC + validation
5. register in routes/index.ts     -> mount under /api/v1
```

> Reference implementation to copy: `userService.ts` -> `userController.ts` -> `userRoutes.ts`.

---

## Tech Stack Summary

| Layer | Tech |
|-------|------|
| Runtime | Node.js + TypeScript |
| Framework | Express 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL 17 |
| Auth | JWT + bcrypt + RBAC |
| Validation | Joi |
| Queue | BullMQ + Redis |
| Docs | Swagger (OpenAPI) at `/api-docs` |
| ML | HTTP client -> Python FastAPI service |

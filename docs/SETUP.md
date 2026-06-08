# Local Setup Guide

## Prerequisites
- Node.js >= 20.0.0
- Docker Desktop (running)
- Git

## Step-by-Step Setup

### 1. Clone & enter the repo
```bash
git clone <repo-url>
cd amdox-erp
```

### 2. Copy environment file
```bash
cp .env.example .env
```
Edit `.env` — ask M1/M2 for dev credentials.

### 3. Start infrastructure
```bash
docker-compose up -d
```
Wait ~30 seconds for all services to be healthy.

### 4. Verify services are running
| Service | URL |
|---------|-----|
| PostgreSQL | localhost:5432 |
| pgAdmin UI | http://localhost:8081 |
| Redis | localhost:6379 |
| Redis UI | http://localhost:8082 |
| Keycloak | http://localhost:8080 |
| Elasticsearch | http://localhost:9200 |

### 5. Install backend dependencies
```bash
cd backend && npm install
```

### 6. Run migrations & seeds
```bash
npm run migrate
npm run seed
```

### 7. Install frontend dependencies
```bash
cd ../frontend && npm install
```

### 8. Start dev servers
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

### 9. Open in browser
- App: http://localhost:3000
- API: http://localhost:5000
- Swagger: http://localhost:5000/api-docs

## Git Workflow

```bash
# Always branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/m3-finance-ledger

# After work
git add .
git commit -m "feat(finance): add GL journal entry API"
git push origin feature/m3-finance-ledger
# Open PR → dev
```

## Branch Naming Convention
```
feature/m1-devops-ci
feature/m2-auth-jwt
feature/m3-finance-ledger
feature/m4-hr-employee
feature/m4-payroll-engine
feature/m5-supply-chain-po
feature/m5-ml-forecasting
feature/m6-dashboard-builder
fix/m3-currency-exchange
```

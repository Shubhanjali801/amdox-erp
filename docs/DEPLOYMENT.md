# Amdox ERP — Deployment Guide

Spec-aligned, free-tier deployment:

| Part | Host | Free tier |
|------|------|-----------|
| Frontend (Vite) | **Vercel** | yes |
| Backend (Express) | **Railway** | ~$5 credit |
| PostgreSQL | **Supabase** | yes |
| Redis | **Upstash** | yes (10k/day) |
| ML service (FastAPI) | **Railway** (optional) | heavier — optional for demo |

Deploy order: **Supabase → Upstash → Railway (backend) → Vercel (frontend) → (optional) ML**.

---

## 1. PostgreSQL — Supabase
1. Create a project at https://supabase.com → wait for it to provision.
2. **Project Settings → Database → Connection string → URI**. Copy it.
   It looks like: `postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres`
3. Save this as **`DATABASE_URL`** (you'll paste it into Railway).

> Migrations run automatically on backend deploy (`prisma migrate deploy` in the Dockerfile).
> To seed demo data after first deploy, run locally against the Supabase URL:
> `DATABASE_URL="<supabase-url>" npx ts-node src/db/seeds/seed-forecast-data.ts`

## 2. Redis — Upstash
1. Create a database at https://upstash.com (Redis).
2. Copy the **`rediss://`** connection URL (Details → "Redis Connect" → Node URL).
3. Save as **`REDIS_URL`**.

## 3. Backend — Railway
1. https://railway.app → **New Project → Deploy from GitHub repo** → pick this repo.
2. Set **Root Directory** = `backend`. Railway auto-detects the Dockerfile.
3. Add **Variables**:

```
NODE_ENV=production
DATABASE_URL=<from Supabase>
REDIS_URL=<from Upstash>
JWT_SECRET=<long random string>
JWT_REFRESH_SECRET=<another long random string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=https://<your-vercel-app>.vercel.app
CORS_ORIGINS=https://<your-vercel-app>.vercel.app,https://www.amdox.in
FRONTEND_URL=https://<your-vercel-app>.vercel.app
ML_SERVICE_URL=<railway ML url, or leave default if not deploying ML>
GMAIL_USER=<your gmail>
GMAIL_APP_PASSWORD=<16-char app password>
MAIL_FROM_NAME=Amdox ERP
```
   - Don't set `PORT` — Railway injects it; the app reads `process.env.PORT`.
4. Deploy. Copy the public URL → e.g. `https://amdox-backend.up.railway.app`.
5. Health check: open `https://<backend>/api/v1/health/live` → returns `{ status: "ok" }`.

## 4. Frontend — Vercel
1. https://vercel.com → **Add New → Project** → import this repo.
2. Set **Root Directory** = `frontend`. Framework auto-detects **Vite** (`vercel.json` included).
3. Add **Environment Variable**:
```
VITE_API_BASE_URL=https://<your-railway-backend>/api/v1
```
4. Deploy → you get `https://<app>.vercel.app`.
5. **Back on Railway**, set `CLIENT_URL` / `CORS_ORIGINS` / `FRONTEND_URL` to this exact Vercel URL, then redeploy the backend.

## 5. (Optional) ML service — Railway
1. New service in the same Railway project → **Root Directory** = `ml-service` (Dockerfile detected).
2. After deploy, copy its URL → set backend `ML_SERVICE_URL` → redeploy backend.

> PyTorch is large — the ML build is slow/memory-hungry. If it won't fit the free tier,
> skip it: the forecast page shows **"ML service: offline"** and the rest of the ERP works.

---

## Post-deploy checklist
- [ ] `GET https://<backend>/api/v1/health/live` → ok
- [ ] Register a company on the Vercel site → lands on dashboard
- [ ] Login, create a vendor/inventory item → persists (Supabase)
- [ ] Forgot-password email arrives (Gmail creds set)
- [ ] (if ML deployed) Forecast returns a chart

## Common gotchas
- **CORS error** → Vercel URL not in `CORS_ORIGINS`. Fix on Railway + redeploy.
- **500 on first request** → migrations didn't run; check Railway logs for `prisma migrate deploy`.
- **Redis errors** → wrong `REDIS_URL` (use the `rediss://` URL from Upstash).
- **Frontend calls localhost** → `VITE_API_BASE_URL` not set on Vercel (it's baked at build time — redeploy after setting it).

---

## Alternative: one VPS with Docker Compose
If you prefer a single server (fits PyTorch easily):
```bash
docker-compose -f docker-compose.prod.yml up -d
```
Add Nginx + Let's Encrypt (certbot) for TLS + your domain.

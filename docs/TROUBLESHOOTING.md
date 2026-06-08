# Troubleshooting Guide — Amdox ERP

## Docker Issues

### PostgreSQL not starting
```bash
docker-compose down -v   # remove volumes
docker-compose up -d     # fresh start
```

### Port conflicts
Edit `docker-compose.yml` port mappings if 5432/6379/8080 are in use.

## Prisma Issues

### Migration out of sync
```bash
cd backend
npx prisma migrate reset   # WARNING: drops all data
npx prisma migrate deploy
npm run seed
```

### Prisma client not generated
```bash
npx prisma generate
```

## Auth Issues

### JWT expired immediately
Check `JWT_EXPIRES_IN` in `.env` — set to `15m` not `15`.

### MFA not working
Ensure server time is synced — TOTP is time-sensitive.

## Build Issues

### TypeScript errors
```bash
cd backend && npm run type-check
cd frontend && npm run type-check
```

# Deployment Guide — Amdox ERP

## Staging Deployment

```bash
# Tag and push
git tag v1.0.0-staging
git push origin v1.0.0-staging
# GitHub Actions deploy.yml triggers automatically
```

## Production Deployment

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Environment Variables (Production)
See `.env.example` for all required variables.
Set `NODE_ENV=production` in all services.

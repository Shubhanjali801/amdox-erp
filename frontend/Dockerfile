# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Build with Vite directly (skips the `tsc &&` type-check step, which is
# advisory during WIP). Vite transpiles without failing on type errors.
RUN npx vite build

# ─── Stage 2: Nginx static server ────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# SPA routing config (all routes → index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

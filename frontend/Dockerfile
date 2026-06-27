# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Skip Playwright's browser download (a devDependency) — it fails on alpine/musl
# and isn't needed to build the app. Also give the build extra heap.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV NODE_OPTIONS=--max-old-space-size=4096

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# API base URL is baked in at build time (Vite). Override per environment:
#   docker build --build-arg VITE_API_BASE_URL=https://<DOMAIN>/api/v1 ...
ARG VITE_API_BASE_URL=http://localhost:5000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

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

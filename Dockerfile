# syntax=docker/dockerfile:1
#
# Combined single app (ADR-0007): one container runs the Hono API and serves the
# built Vue SPA from the same origin. Server runs via tsx (no compile step) — see
# ADR-0004 + hetzner-port notes; shared/ ships as raw .ts and tsx resolves it.

# ---- Stage 1: build the Vue client (static SPA) ----
# Pin node patch + npm. package-lock.json is generated with npm 11, which keeps
# ALL platform optional deps (e.g. @rollup/rollup-linux-x64-gnu for the amd64
# Coolify host); npm 10 prunes non-host platforms and breaks the build. node
# 22.14.0 ships npm 10.9.8, so bump to 11 to match the lockfile generator.
FROM node:22.14.0-slim AS client-build
WORKDIR /app
RUN npm install -g npm@11.13.0

# Workspace manifests + root lockfile first, for layer caching. npm ci here is
# the FULL install (vite/terser are devDeps needed to build the client).
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY shared/package.json ./shared/
RUN npm ci

# Source. The client imports @voip-accelerator/shared (runtime zod) and the
# AppType from @voip-accelerator/server (type-only, erased at build).
COPY shared ./shared
COPY server ./server
COPY client ./client

# Same-origin combined app: the client calls relative /api, so no
# VITE_API_BASE_URL is set — auth.ts falls back to window.location.origin.
RUN npm --prefix client run build

# ---- Stage 2: runtime ----
FROM node:22.14.0-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN npm install -g npm@11.13.0

# Prod deps only. tsx is a prod dependency, so --omit=dev still yields a runtime
# that can execute the server's .ts directly. --ignore-scripts skips the client's
# dev-only `prepare: husky install` (husky is omitted here); no prod dep needs an
# install script (esbuild ships its binary via an optional platform package).
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY shared/package.json ./shared/
RUN npm ci --omit=dev --ignore-scripts

# App code (run as .ts via tsx) + the LERG seed CSV (read file-relative by the
# seed script). client source is not copied — only its built output, below.
COPY server ./server
COPY shared ./shared
COPY enhanced_lerg.csv ./enhanced_lerg.csv

# The built SPA from stage 1, served by Hono at / in production.
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 3000

# Readiness: /api/ping returns 200 once migrations have created enhanced_lerg
# (even before seeding). Uses node's global fetch — no curl/wget in the image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/ping').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Migrations run on every boot (idempotent — drizzle tracks applied migrations).
# The LERG seed is a one-off first-deploy command (see the Coolify checklist),
# not run here, so restarts don't re-upsert 450 rows each time.
CMD ["sh", "-c", "npx tsx server/src/db/migrate.ts && npx tsx server/src/index.ts"]

# API server stack: Node + Hono + better-auth + Drizzle

The new backend ([[0002-custom-backend-over-self-hosted-supabase]]) is a single Node process running Hono as the web framework, better-auth for sessions and email/password, and Drizzle for Postgres access. The Vue client consumes the API via Hono's `hc` RPC client, with types shared through a monorepo workspace (`{client, server, shared}`).

## Why these four, specifically

- **Node + Hono** over Node + Fastify or Bun + Hono/Elysia. Hono's handler shape (`(c) => c.json(...)`) maps cleanly onto the existing edge-function bodies, so the port is largely mechanical. Node 22 is the most operationally boring runtime on a single Hetzner VM — every monitoring agent, pm2 alternative, and Postgres client assumes Node. Bun's startup-time wins are irrelevant on a long-lived server, and we avoid occasional native-module surprises. Fastify is fine but its plugin model is overkill for ~10 routes.
- **better-auth** over Lucia, Auth.js, or roll-your-own. Lucia is in maintenance-mode by its author's own recommendation. Auth.js is designed around Next.js and is awkward elsewhere. Rolling our own gives 200 lines of footguns (timing-safe reset tokens, secure cookie flags, CSRF, session fixation, login rate limiting) for no real win. better-auth provides email/password, sessions, password reset, and an admin/role plugin out of the box, with a Hono adapter and a Drizzle adapter that minimise glue code.
- **Drizzle** over Prisma, Kysely, or raw `pg`. better-auth's Drizzle adapter is the most-used and best-documented; Drizzle's TS-first schema lives next to app code and migrations are emitted as readable SQL files (unlike Prisma's opaque migrations). The query API stays close to SQL.
- **Hono RPC** over plain REST + shared types or OpenAPI codegen. No codegen, no drift, no third-party API consumers planned — the value of OpenAPI's ceremony would be unrealised. Shared zod schemas in `shared/` are the single source of truth for request/response validation.

## Consequences

- The repo becomes a workspace (`client/`, `server/`, `shared/`). The existing `client/` folder stays where it is; `server/` and `shared/` are added next to it.
- Single-active-session enforcement (formerly via `useSessionHeartbeat`) is dropped — it was a paid-product guard that no longer fits a free product. If reinstated later, it becomes a small extension on better-auth's session table.
- The client cannot use `@supabase/supabase-js` for anything. All ~35 call sites are rewritten to use the Hono RPC client.
- Database access control moves from Postgres RLS to API-handler-level auth checks ([[0002-custom-backend-over-self-hosted-supabase]]).

# Keep Vue, do not rewrite frontend to React/Next.js

The frontend stays on Vue 3 + Pinia + Vite + Tailwind. The Hetzner port and the facelift do not include a framework rewrite. A future migration to React (or Nuxt, or anything else) is treated as a separate project, not bundled with this one.

## Considered options

- **Rewrite to Next.js.** SSR/SEO + file-based routing + integrated API routes.
- **Rewrite to vanilla React** (Vite + React Router + TanStack Query). Same app shape as today, different framework.
- **Stay on Vue.**

## Why stay

- The Supabase-coupling problem this migration solves is framework-independent. Vue is not the bottleneck.
- The Pinia stores carry real engineering investment: `markRaw()` memory optimizations on 250k-record datasets, manual reactivity triggers, web-worker handoffs, and AZ/US storage-strategy split. Re-implementing all of that in React would be most of the project budget by itself — and risks performance regressions in the exact code path we're trying to keep stable.
- Two of the three reasons to choose Next.js do not apply: this is a logged-in tool (no SEO/SSR need) and we're building a separate Hono backend (so API routes would duplicate work).
- The facelift is a visual/branding refresh and does not require a framework change. Tailwind tokens and component styles can be rewritten without touching the component tree.
- Stacking a framework rewrite on top of a backend port, auth migration, billing removal, deployment change, and design facelift creates an attribution problem: when something breaks, you have too many suspects.

## Consequences

- Future contributors who prefer React will find the codebase less attractive.
- If a framework switch is ever desired, it is sequenced *after* the Hetzner port is live and stable, as a separate project with its own plan.
- The Hono RPC client ([[0004-api-server-stack]]) is consumed from Vue; this works fine — type safety is a TS feature, not a React feature — but is less well-trodden than the React equivalent.

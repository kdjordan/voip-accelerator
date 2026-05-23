# Custom backend over self-hosted Supabase

When migrating off Supabase, we are building a custom Node API server rather than running the open-source Supabase stack on Hetzner. The new backend is a single Hono application backed by Postgres; Supabase's GoTrue, PostgREST, Realtime, Storage, Studio, and Kong are not preserved.

## Considered options

- **Self-host Supabase** via the official docker-compose. Existing client code (`@supabase/supabase-js` calls, RLS policies, edge functions written in Deno) carries over largely unchanged.
- **Custom backend.** Rewrite the ~15 edge functions as Hono routes. Replace Supabase Auth with a library ([[0004-api-server-stack]]). Replace RLS with auth checks in the API layer. Use Drizzle for Postgres access.

## Why custom

- The app uses Postgres + Auth heavily but does **not** use Realtime or Storage. Self-hosted Supabase would run seven containers when we only need the equivalent of two.
- Operating the Supabase stack on a single Hetzner VM means managing the upgrade cadence and internal coupling of seven services (GoTrue config drift, PostgREST schema cache, Realtime memory behavior, Kong routing rules). For a solo operator, this is a large ongoing tax.
- The Hetzner port already includes a dead-code purge ([[0001-clean-slate-user-migration]] and the Stripe / organizations / upload-history removals). This is the cheapest moment in the product's life to also escape the Supabase abstraction entirely.
- The number of edge functions to port is modest (~10 after dead-code removal), and most are thin wrappers around a single DB query. Rewriting them as Hono routes is largely mechanical.
- Hetzner has no managed Postgres. Whether we self-host Supabase or just Postgres, we are running Postgres ourselves either way — running *only* Postgres is dramatically simpler.

## Consequences

- All RLS policies are replaced with auth checks in API handlers. The DB no longer enforces row-level access on its own.
- We lose Supabase Studio. Day-to-day DB access uses TablePlus / DBeaver / `psql` directly.
- The client no longer talks to the database via PostgREST conventions. Every `supabase.from('...')` call site must be rewritten to call a Hono endpoint via the [[0004-api-server-stack]] RPC client.

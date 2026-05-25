# Combined single-app deployment: one container serves API + SPA

VoIP Accelerator deploys as **one Coolify application** — a single container (root `Dockerfile`) that runs the Hono API and serves the built Vue SPA from the same origin: `/api/*` is handled by Hono, every other path falls through to the static SPA with history-mode fallback to `index.html`. Postgres stays a separate Coolify resource. The server runs directly via `tsx` with no compile step. This supersedes the "Postgres + Hono API + Vue static as separate Coolify applications" deploy unit described in [[0004-api-server-stack]] and [[0005-coolify-on-hetzner]]; their stack and host choices are unchanged.

## Why one combined app

- **Same-origin removes a whole class of problems.** better-auth ([[0004-api-server-stack]]) is cookie-based. Serving the SPA and the API from one origin makes the session cookie first-party — no cross-subdomain `SameSite`/domain config, no CORS preflight, and the simplest CSRF posture (`BETTER_AUTH_TRUSTED_ORIGINS` is just the one origin).
- **No build-time API URL.** The client calls relative `/api` and falls back to `window.location.origin`, so there is no `VITE_API_BASE_URL` to bake per environment. One fewer thing to get wrong between the Coolify magic URL and `voipaccelerator.com`.
- **One deploy unit.** One container, one health check (`/api/ping`), one log stream, one rollback. For a solo operator this is the same operational-simplicity logic that drove [[0006-co-host-with-telcos-main]].
- A separate static-site app plus an API app would need either domain-scoped cookies (`.voipaccelerator.com`) or CORS-with-credentials — real configuration for an isolation we do not need. The two halves are one product, one release.

## Why tsx in production (no compile step)

- The monorepo ships `shared/` as raw `.ts` and the server imports it via workspace specifiers. A `tsc` build failed twice over: tsc errors on `drizzle.config`'s `rootDir`, and even past that, `node dist/index.js` crashes with `ERR_UNKNOWN_FILE_EXTENSION '.ts'` on the bare `@voip-accelerator/shared` import. `tsx` resolves `.ts` at runtime and sidesteps both.
- `tsx` is already the dev runtime; using it in prod erases the dev/prod gap and an entire build stage. It is declared a production dependency so `npm ci --omit=dev` still yields a working runtime.
- Cost accepted: the image ships TypeScript source (not a minified `dist`), and `tsx` transpiles on process start — negligible for a long-lived server.

## Considered and rejected

- **Two Coolify apps (static site + API), the original [[0005-coolify-on-hetzner]] posture.** Pays cross-origin cookie/CORS complexity for an isolation that has no payoff here.
- **Compile the server with `tsc`/esbuild to `dist/`.** Fights the raw-`.ts` `shared/` workspace (above) for a startup-time win that does not matter on a persistent server.

## Consequences

- The server process carries a **prod-only** (`NODE_ENV === 'production'`) static-serving + SPA-fallback branch; dev is unchanged (Vite on :5173 proxying `/api` to :3000). The `/api/*` routes are mounted first and are terminal, so the SPA catch-all never shadows them.
- The image bundles the server's TS source plus `tsx`. It is ~890 MB today because the runtime `npm ci --omit=dev` installs every workspace's prod deps (including the client's, unused at runtime) — a known slimming opportunity, not a blocker.
- Build- and run-time npm is pinned to **11.13.0** in the `Dockerfile`: npm 11 preserves all platform optional deps in the lockfile (the amd64 host needs `@rollup/rollup-linux-x64-gnu`), which npm 10 prunes.
- **Reversal is mechanical:** drop the static-serving branch, add a static-site Coolify app pointed at `client/dist`, and set `VITE_API_BASE_URL` plus a cross-origin cookie/CORS config. No data migration — Postgres is already its own resource.

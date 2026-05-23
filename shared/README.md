# shared

Cross-package code shared between `client/` and `server/`:
- `brand.ts` — product name, domain, mailer-from. Single source of truth so a future rename / domain change is a config change, not a refactor.
- (Phase 2) Zod schemas for API request/response validation.
- (Phase 2) Re-exports of the Hono `hc` RPC client type for the client to consume.

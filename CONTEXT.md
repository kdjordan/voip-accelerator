# VoIP Accelerator — Context

A web application for managing and analyzing VoIP telecommunications data: rate sheet processing, LERG data management, and NANP (North American Numbering Plan) categorization.

## Glossary

### Rate sheet
A CSV/Excel file of telecom destinations and pricing uploaded by a user. Two flavors:
- **AZ rate sheet** — international destinations. Stored in-memory only, optimized with `markRaw()`. Complex effective-date semantics per destination.
- **US rate sheet** — domestic/NANP destinations. Persisted to IndexedDB via Dexie in 1000-record bulk batches.

### LERG
Local Exchange Routing Guide. The authoritative North American telephone numbering dataset. In this app, "the LERG" refers to the enhanced LERG database (449 NPAs with geographic context) which is the single source of truth for all NANP categorization. Lives in Postgres; loaded into a Pinia store on app start.

### NANP (North American Numbering Plan)
The +1 numbering plan covering US, Canada, Caribbean, and US territories. The app's NANP categorization system uses confidence scoring to distinguish "safe" +1 destinations (US, Canada) from "expensive" ones (Caribbean, territories) when filtering rate sheets.

### NPA
Numbering Plan Area — the three-digit area code in a +1 number. A single LERG record. NPAs have geographic context (country, region, state/province).

### +1 destination
Any rate-sheet entry under the +1 country code. The system filters these per rate-sheet type:
- US uploads → optional user-driven filtering via the "+1 handling modal" to keep only US/Canada
- AZ uploads → all +1 destinations collapsed under the label "North America"

### Free forever
The product is offered with no billing. All Stripe / subscription / tier logic has been removed from product surfaces (footer pricing link gone, signup copy updated) and is being removed from the codebase as part of the Hetzner port.

## Architecture context

### Hetzner port (in progress)
Migration off Supabase to a self-hosted backend on Hetzner. Decisions locked so far:
- Clean slate — no user data preserved.
- Custom backend (not self-hosted Supabase).
- Stack: Node + Hono (web framework) + better-auth (sessions/email-password) + Drizzle (Postgres access).
- Frontend stays Vue 3 + Pinia + Vite. No framework switch.
- Frontend deploys to the same Hetzner box via Coolify.
- Hetzner Cloud VM + Coolify (PaaS-on-VM) running Postgres + API + frontend as separate Coolify applications.
- Production only — no staging environment.

### Facelift (in progress)
A design + branding refresh shipped alongside the Hetzner port. Scope:
- Visual design, component styling, color palette, typography, marketing/onboarding copy.
- New brand identity under the existing name "VoIP Accelerator" and existing domain `voipaccelerator.com`.
- **Not** a framework rewrite, architecture change, or rework of business logic (rate sheet processing, LERG, NANP categorization stay as-is).
- **Not** a component library swap — Headless UI primitives + restyled hand-rolled `Base*` components stay.
- **Not** an IA / navigation overhaul.

### Brand-as-config
Product name, short name, domain, mailer-from, and other brand strings are stored as a single source of truth (`shared/brand.ts`) so a future rename / SEO-driven domain change is a config change, not a refactor. A keyword-driven rename is deferred to a separate post-launch project.

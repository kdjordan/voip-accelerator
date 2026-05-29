# VoIP Accelerator — Context

A web application for managing and analyzing VoIP telecommunications data: rate sheet processing, LERG data management, and NANP (North American Numbering Plan) categorization.

## Glossary

### Rate sheet
A CSV or XLSX file of telecom destinations and pricing uploaded by a user. Two flavors:
- **AZ rate sheet** — international destinations. Stored in-memory only, optimized with `markRaw()`. Complex effective-date semantics per destination.
- **US rate sheet** — domestic/NANP destinations. Persisted to IndexedDB via Dexie in 1000-record bulk batches.

**Spreadsheet format is transparent**: CSV and XLSX are accepted interchangeably on any upload (a CSV and an XLSX can be compared side-by-side); both normalize to the same rows before mapping/validation. Exports offer a CSV/XLSX choice whose default is inferred from what was uploaded. See [[docs/adr/0010-xlsx-upload-export]]. (PDF outputs — audit/build summaries — are a separate, non-tabular concern.)

### LERG
Local Exchange Routing Guide. The authoritative North American telephone numbering dataset. In this app, "the LERG" refers to the enhanced LERG database (450 NPAs with geographic context) which is the single source of truth for all NANP categorization. Lives in Postgres; loaded into a Pinia store on app start.

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

### Provider deck
A single vendor's uploaded US rate sheet inside the Rate Composition Studio (`/rate-gen/us`). Up to five provider decks are held in memory at once; users add, remove, and swap them on the Upload tab. Each carries per-prefix interstate / intrastate / indeterminate rates.

### Scenario
A candidate rate-deck configuration: one **LCR strategy** paired with one **markup**. Scenarios are *simulated*, not persisted — users build several in the Simulation Preview tab and compare their outcomes before committing one (or more) to a full generate. Distinct from a **Generated rate deck**.

### Simulation sample
A fixed random subset of the uploaded NPANXX universe (the union of all provider decks' prefixes) used to preview a scenario's outcome cheaply, without a full generate. The *same* sample is reused across every scenario in a comparison so their results are directly comparable.

### Generated rate deck
The full, committed output of running one chosen scenario's LCR selection over **every** uploaded prefix. Held **in memory for the current session only** (not persisted) — cheap to regenerate, so it clears on reload. Multiple generated rate decks can coexist (e.g. one per chosen strategy); exportable as a Final Rate Deck CSV, a Route Distribution CSV, and a Build Summary PDF. Distinct from a **Scenario**, which is only ever simulated against a sample.
_Avoid_: "deck" alone when a provider deck is meant — say **provider deck** vs **generated rate deck**.

### Rate deck hand-off
The act (and the unit) of moving a US rate table from one module into another — Composition Studio, Adjuster (Pricing Studio), or Analyzer (comparison). The portable unit is reduced to its common denominator: **NPANXX-keyed interstate / intrastate / indeterminate rates** (`npa`/`nxx`/`stateCode` re-derived from the LERG on landing). It is a **snapshot of effective rates at the moment of transfer**, decoupled from the source — if the source is later regenerated or re-adjusted, the landed copy is stale and does **not** auto-update.
The rates carried are **materialized**: any LCR strategy, global/fixed markup, or per-state/metro adjustment is already baked into the numbers, so no re-appliable markup/strategy/rule metadata travels — only the resulting rates. (Consequence: a deck generated with markup lands already marked-up.)

### Total prefixes
The union of all selected provider decks' prefixes — the universe a generated deck prices. The denominator for the studio's coverage figures. There is no larger reference set (the LERG is NPA-level; the app cannot enumerate all valid NPANXX), so a generated deck covers this universe by definition — hence there is no "uncovered" figure.

### Single-sourced prefix
A prefix that only **one** of the selected providers quotes — it is priced and appears in the deck, but there is no LCR competition for it. Surfaced as a coverage-quality signal (a count) in the Simulation Preview; not a per-provider gap matrix. This is the studio's headline coverage signal (an "uncovered" count would always be 0 — see **Total prefixes**).

### Win rate (by rate type)
For a scenario, the share of priced prefixes for which a given provider is the **selected** source (lowest per the LCR strategy), reported **separately** for interstate, intrastate, and indeterminate — because LCR selects each rate type independently, so the winner can differ by jurisdiction within one prefix. This is the studio's **primary** simulation signal ("how the rates will work" — which provider dominates each jurisdiction). A single per-prefix "selected provider" (used for the route map) is attributed to the **interstate** winner.

### Complete deck (rate completeness)
A valid provider-deck row must have a positive **interstate** and **intrastate** rate; **indeterminate** derives from interstate when absent. A row missing either inter or intra is **corrupt input**, rejected at upload (routed to the invalid-rows error list) — never rendered with a 0 and never handled at generation time. Consequence: every prefix in the generated deck is fully priced (no unpriced/"None" rows).

## Architecture context

### Hetzner port (in progress)
Migration off Supabase to a self-hosted backend on Hetzner. Decisions locked so far:
- Clean slate — no user data preserved.
- Custom backend (not self-hosted Supabase).
- Stack: Node + Hono (web framework) + better-auth (sessions/email-password) + Drizzle (Postgres access).
- Frontend stays Vue 3 + Pinia + Vite. No framework switch.
- Frontend deploys to the same Hetzner box via Coolify.
- Existing Hetzner CPX31 VM (already hosting TelcoOS-Main on SQLite) gets a third Coolify project for VoIP Accelerator: a Coolify-managed Postgres plus one combined application — a single container that runs the Hono API and serves the built Vue SPA from the same origin (ADR-0007). Project-level isolation, shared host.
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

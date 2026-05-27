# CLAUDE.md

Guidance for Claude Code when working in this repository.

**Be concise** — sacrifice grammar for concision in your responses. **Do not create any `.md` documentation file unless explicitly asked.**

## Project Overview

**VoIP Accelerator** — web app for managing and analyzing VoIP telecom data (rate sheets, LERG data, pricing comparisons).

**Tech Stack:**
- **Client:** Vue 3 (Composition API, `<script setup>`), TypeScript, Vite, Pinia, TailwindCSS, Dexie (IndexedDB).
- **Server:** Node/TypeScript (`tsx`), PostgreSQL + Drizzle ORM, better-auth.
- Self-hosted on Hetzner via Coolify (migrated off Supabase/AWS). Infra + deploy state lives in auto-memory — `main` is the live prod branch and deploys are a **manual** Coolify action (a push does NOT auto-deploy).

**Current focus:** US-NPANXX. A-Z (international) is hidden in nav + route guards but the code is retained (reversible) — see auto-memory.

## Commands (run in `client/`)

```bash
npm run dev            # Vite dev server (localhost:5173); API server runs on :3000
npm run build          # production build   (build:staging for staging)
npm run preview        # preview a build
npm run test           # Vitest (watch);  test:watch is the same
npm run test:integration   # critical-path integration tests — run before commit
npm run test:unit          # pure-function unit tests
npm run test:components    # component tests
npm run test:coverage      # coverage
npm run regression-check   # integration + typecheck + build — run before merging to main
```

**NOTE:** the dev server is normally always running — don't start it unless it's actually down (then `npm --prefix client run dev`; API on :3000).
**TypeScript:** there is known pre-existing type-check debt; `regression-check` treats it as a non-blocking warning. Don't try to fix unrelated type errors.

## Testing approach

Test-first for substantive changes: write/adjust tests, then implement, then verify. `npm run test:integration` before commit; `npm run regression-check` before merging to `main`. Prioritize coverage for: auth & access-control flows, route guards, data processing (CSV parse, LERG/NANP categorization, rate calculations), and Dexie/store logic. Vitest runs in a jsdom environment.

## Architecture

**Directory layout** (`client/src/`):
- `components/` by feature: `az/`, `us/`, `rate-sheet/`, `rate-gen/`, `admin/`, `shared/`, `home/`, `auth/`, `dashboard/`, `exports/`
- `stores/` (Pinia), `services/` (business logic / API), `workers/` (web workers), `composables/`, `utils/`, `types/` (known debt area)

**State management — AZ and US differ by design (performance):**
- **AZ rate sheets:** in-memory only (no IndexedDB). `markRaw()` on large datasets (~50–70% less reactivity overhead); manual reactivity via `triggerDataUpdate()`; per-destination effective-date handling.
- **US rate sheets:** full IndexedDB persistence via Dexie; batched `bulkPut()` in ~1000-record chunks; heavy CSV parse / sort / adjust offloaded to web workers (a worker may own its own Dexie connection — see `us-rate-adjuster.worker.ts`).

**LERG / NANP:** server PostgreSQL is the source of truth; loaded once into `stores/lerg-store-v2.ts` (Pinia) on app startup via `composables/useLergOperations.ts`. NANP categorization (with confidence scoring; LERG → constants → inference precedence) lives in `utils/nanp-categorization.ts`; admin management in `components/admin/UnifiedNANPManagement.vue`.

**API:** Vite proxy forwards `/api` → `http://localhost:3000`. Env files: `.env.development`, `.env.staging`, `.env.production`.

**Build:** Vite manual chunking; web workers emitted as ES modules; Terser minification in prod.

## UI Conventions

- **NEVER use native `alert()`, `confirm()`, or `prompt()`** — they block the thread, can't be styled, and don't match the app. Use the shared modals:
  - **Confirm / destructive / yes-no** → `components/shared/ConfirmationModal.vue` (`v-model` open state; `title`/`message`/`confirmButtonText`/`cancelButtonText`; pass `confirmationPhrase` to require typing a phrase for high-stakes actions like clearing all data).
  - **Notices / success / error / info** → `components/shared/InfoModal.vue` (or `NoticeModal.vue`).
  - If a needed pattern doesn't exist, add it to `components/shared/` — don't reach for a native dialog.
- **Known native-dialog violations to migrate** (fix opportunistically when you touch these; verify before relying): `UserTable.vue`, `UserRoleSelector.vue`, `UserStatusToggle.vue`, `UnifiedNANPManagement.vue`, `NANPDiagnostics.vue`, `UserManagement.vue`, `AdminView.vue`, `AZEffectiveDates.vue`.
- Vue 3 Composition API + `<script setup>`; absolute imports via the `@/` alias; single quotes, semicolons, 2-space indent (ESLint + Prettier).

## Proven Patterns (keep using)

```typescript
// markRaw() for large AZ datasets to avoid Vue reactivity overhead
this.groupedData = markRaw(data) as GroupedRateData[];
triggerDataUpdate() { this.dataUpdateTrigger++; }   // manual reactivity when needed

// Prevent concurrent operations — include operationInProgress in store state
if (this.operationInProgress) return;
this.operationInProgress = true;

// Offload heavy work to a worker; post PLAIN objects, not reactive proxies
worker.postMessage({ data: plainData });
```

- Role-based access: `const hasPermission = user.role === 'superadmin' || user.role === 'admin';`
- Always validate required env vars at startup and throw if missing.

## Secret Management

- **NEVER hardcode secrets, API keys, or sensitive data.** Use environment variables; secrets live only in gitignored `.env` files.
- In docs/session notes use `[REDACTED]` or the variable name, never the value.
- Access via `process.env.MY_VAR` (or `Deno.env.get(...)` where relevant), never a literal.

## Known Technical Debt

- `src/types/`: ~22 files mixing constants and type definitions, with duplication and inconsistent naming. Address incrementally — not a full rewrite.

## Reality Filter — behavioral rules

- **Don't present guesses, inferences, or speculation as fact.** If you can't verify something, say so ("I cannot verify this" / "I don't have access to that"). Label unverified content at the start of the sentence: `[Inference]` / `[Speculation]` / `[Unverified]`.
- Ask for missing info rather than filling gaps. Don't paraphrase or reinterpret the user's input unless asked.
- If you use **prevent / guarantee / will never / fixes / eliminates / ensures**, label the claim unless it's sourced. For claims about LLM behavior (including your own), mark `[Inference]`/`[Unverified]`.
- **Never claim something is "fixed" or "working" until the user has tested it.** State explicitly what needs testing; wait for confirmation before marking resolved.
- **Debug root cause, not symptoms** — check logs, errors, and actual data before assuming.
- Be direct about what changed; acknowledge when a previous attempt failed.
- **Auth / route-guard issues:** check BOTH the client-side route guards AND the server (better-auth) — a server-side failure can make a guard fail-safe and block access. Verify with a direct DB query if the server path is suspect.

<!-- CODEGRAPH_START -->
## CodeGraph

This project has a CodeGraph MCP server (`codegraph_*` tools) configured. CodeGraph is a tree-sitter-parsed knowledge graph of every symbol, edge, and file. Reads are sub-millisecond and return structural information grep cannot.

### When to prefer codegraph over native search

Use codegraph for **structural** questions — what calls what, what would break, where is X defined, what is X's signature. Use native grep/read only for **literal text** queries (string contents, comments, log messages) or after you already have a specific file open.

| Question | Tool |
|---|---|
| "Where is X defined?" / "Find symbol named X" | `codegraph_search` |
| "What calls function Y?" | `codegraph_callers` |
| "What does Y call?" | `codegraph_callees` |
| "How does X reach/become Y? / trace the flow from X to Y" | `codegraph_trace` (one call = the whole path, incl. callback/React/JSX dynamic hops) |
| "What would break if I changed Z?" | `codegraph_impact` |
| "Show me Y's signature / source / docstring" | `codegraph_node` |
| "Give me focused context for a task/area" | `codegraph_context` |
| "See several related symbols' source at once" | `codegraph_explore` |
| "What files exist under path/" | `codegraph_files` |
| "Is the index healthy?" | `codegraph_status` |

### Rules of thumb

- **Answer directly — don't delegate exploration.** For "how does X work" / architecture questions, answer with 2-3 codegraph calls: `codegraph_context` first, then ONE `codegraph_explore` for the source of the symbols it surfaces. For a specific **flow** ("how does X reach Y") start with `codegraph_trace` from→to — one call returns the whole path with dynamic hops bridged — then ONE `codegraph_explore` for the bodies; don't rebuild the path with `codegraph_search` + `codegraph_callers`. Codegraph IS the pre-built index, so spawning a separate file-reading sub-task/agent — or running a grep + read loop — repeats work codegraph already did and costs more for the same answer.
- **Trust codegraph results.** They come from a full AST parse. Do NOT re-verify them with grep — that's slower, less accurate, and wastes context.
- **Don't grep first** when looking up a symbol by name. `codegraph_search` is faster and returns kind + location + signature in one call.
- **Don't chain `codegraph_search` + `codegraph_node`** when you just want context — `codegraph_context` is one call.
- **Don't loop `codegraph_node` over many symbols** — one `codegraph_explore` call returns several symbols' source grouped in a single capped call, while each separate node/Read call re-reads the whole context and costs far more.
- **Index lag**: the file watcher debounces ~500ms behind writes; don't re-query immediately after editing a file in the same turn.

### If `.codegraph/` doesn't exist

The MCP server returns "not initialized." Ask the user: *"I notice this project doesn't have CodeGraph initialized. Want me to run `codegraph init -i` to build the index?"*
<!-- CODEGRAPH_END -->

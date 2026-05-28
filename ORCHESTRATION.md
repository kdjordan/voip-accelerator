# ORCHESTRATION.md

Multi-agent operating manual for this repo. If you're a Claude session, identify your **role**
(below) and act accordingly. The **CONDUCTOR** keeps the *Current State* board at the bottom
rewritten to reflect reality — **git is the history; this file is the live board.** Do not turn it
into a changelog.

## Environment

- Agents run in **cmux** (cmux.com) — a terminal app with a vertical tab per task (shows git branch /
  working dir / ports / notifications) and split panes. cmux is only the UI: it does **not** manage
  worktrees, git, or merging. That's the CONDUCTOR's job.
- Dev/test commands, stack, and conventions: `.claude/CLAUDE.md`. Design system: `DESIGN.md`. Prod/deploy
  state: auto-memory (`MEMORY.md`).

## Roles

### CONDUCTOR — one session, sits on `main`
The single brain that touches shared git state. **If the conductor tab is closed, a fresh session reads
this file, takes the role, and resumes from the Current State board.** Responsibilities:
- Slice the owner's goal into scoped, **independent, single-concern** tasks.
- Per task, create an isolated branch + worktree: `git worktree add ../va-wt-<task> -b feat/<task> main`.
- Write each worker's prompt (template below) — either spawn a sub-agent or hand the owner a prompt to
  paste into a cmux tab (see Worker modes).
- Keep the Current State board rewritten as tasks move.
- On worker "done": review the diff (confirm it's in scope), have the owner gut-check at localhost:5173,
  then merge to `main`, run `npm run regression-check`, remove the worktree (`git worktree remove`) and
  delete the branch.
- Own pushes, deploy tags, and memory updates. **Never push or deploy without owner OK.** Tag every prod
  deploy. Keep `main` releasable and in sync with `origin/main`.

### WORKER — one per task (sub-agent or cmux tab)
- Work ONLY in your assigned worktree dir, on your assigned branch — `cd` there first.
- Do the scoped task. Commit on your branch. Run `npm run regression-check` (+ `test:unit` if you touched
  logic). Report status.
- **Do NOT:** merge, push, touch `main`, create/remove worktrees, edit this file, or run the dev server
  (ports collide across worktrees — verify via tests, not a live server).
- Read `.claude/CLAUDE.md` + `DESIGN.md` before coding. Stay in scope — one task, one branch.

### OWNER
- States goals; pastes conductor-written prompts into cmux tabs (tab-mode workers); gut-checks at
  localhost:5173; approves merges + deploys. Runs no git.

## Worker modes (hybrid — CONDUCTOR picks per task)

- **Sub-agent (default):** conductor spawns via the Agent tool with `isolation: worktree`,
  `run_in_background: true`. **Own context window** — does NOT share the conductor's; only the worker's
  final summary returns (its transcript never enters conductor context). Auto worktree create/cleanup.
  Use for clean, hand-offable chunks — zero work for the owner.
- **cmux tab:** conductor creates the worktree + branch and writes a prompt; owner pastes it into a new
  cmux tab. Use when the owner wants to watch or iterate live. Conductor still merges + cleans up.

## Worker prompt template (conductor fills in)

```
You're a WORKER in this repo's multi-agent flow. First read ORCHESTRATION.md (your role),
.claude/CLAUDE.md, and DESIGN.md.
Worktree: cd <ABS PATH>    Branch: feat/<task>  (already created — don't create others)
Task: <scoped, single-concern description>
Rules: <visual-only | test-first>; no native alert/confirm/prompt (use shared modals); be surgical.
Done = commit on your branch + `npm run regression-check` green, then report. Do NOT merge / push /
touch main / run the dev server. Flag anything you hit that's out of scope.
```

## Rules

- One branch = one coherent concern. No kitchen-sink commits.
- Workers never run the dev server (Vite :5173 / API :3000 collide across worktrees). The owner's main
  tab runs the single dev server for gut-checks; workers verify via `regression-check` + `test:unit`.
- `main` is LIVE PRODUCTION; deploy is a manual Coolify action (a push does NOT auto-deploy). Tag each deploy.
- Only the CONDUCTOR edits this file.

## Current State  *(CONDUCTOR rewrites this — live board, not history)*

**TRACK: Switchboard reskin — PASS 1** (sitewide visual/typographic overhaul to the "Switchboard" design
system; business logic stays 100% intact). Source of truth: repo-root `VoIP Accelerator Design System/`
(`colors_and_type.css` = tokens; `ui_kits/{landing,portal}/page.jsx` = visual targets). See auto-memory
`switchboard-reskin`. Geist Mono headlines + Inter body, arterial-red accent (NO emerald), radius 0,
ticker bar, editorial running heads, light+dark peer themes.

- **Conductor:** main working dir is on **`feat/switchboard-reskin`** @ `c8e8204` (integration branch, off
  `main` @ `6cbb28d`). `main` is UNTOUCHED/clean and stays that way until the whole Pass-1 reskin passes owner
  gut-check; then ONE merge integration→`main` with owner OK. **`main` = `origin/main` = `6cbb28d`;
  PROD = `8b696b7`** (push ≠ deploy; owner deploys via Coolify manually). NEVER merge to main / push /
  deploy without explicit owner OK.
- **Locked decisions (owner, 2026-05-28):** (1) **token bridge** — Tailwind color names point at CSS vars
  + legacy aliases retained, so existing classes re-theme automatically. (2) **Ticker ships in Pass 1**,
  wired to real session KPIs on portal (quiet state when no comparison); landing ticker uses --up/--down.
  (3) **Theme = localStorage only** via `useTheme` (light/dark/system), default dark, **landing forced
  light**; visible selector lands in P2 (SideNav bottom-left).
- **Pass-1 scope = 4 views:** `HomeView.vue` (→ landing kit, light) + `UsView.vue` / `USInsights.vue` /
  `USRateSheetView.vue` (→ portal kit). **DEFERRED to Pass 2 (do NOT touch now):** Rate Composition
  Studio `/rate-gen/us` (will look rough after P1 token swap — EXPECTED), dashboard, admin, auth, footer,
  AppMobileNav, full App.vue shell restructure.

### Staged plan
- **P1 — Foundation** *(✅ MERGED `a9786d4`, regression GREEN, ✅ OWNER-APPROVED 2026-05-28 — "let it go").
  Gotcha resolved: a stale Vite (started pre-P1) was serving old CSS → killed + restarted fresh on :5173,
  `.vite` cache cleared. Also confirmed the landing looks unchanged BY DESIGN (HomeView = 29 `emerald-*`
  literals + `rounded-full` pills, zero `accent` tokens — migrated in P3-V1; P1 leaves literals alone).*
  Delivered: `tailwind.config.js` token bridge (a `v()`
  helper wraps each var in `color-mix` so existing `/opacity` classes like `bg-accent/20` keep working AND
  re-theme — better than the planned `-soft` migration, zero churn); all Switchboard tokens + Geist
  Mono/Inter `@import` + helper classes into `client/src/assets/index.css` (THE real CSS entry — `main.css`
  is DEAD, left untouched); `useTheme.ts` (localStorage `va-theme`, light/dark/system, default dark);
  FOUC boot script in `index.html`; `initTheme()` in `main.ts`; radius flattened to 0 (`full` circles
  kept). Worktree + branch removed. **Note: `color-mix` is a runtime CSS dep** (modern browsers 2023+, fine
  for this audience). Expect the app to look HALF-restyled now — that's correct for this slice. On owner OK → P2.
- **P2 — Shared components & signature patterns** *(✅ COMPLETE — both slices merged to
  `feat/switchboard-reskin` @ `5c93469`; combined P1+P2a+P2b regression-check GREEN; ✅ OWNER-APPROVED
  2026-05-28 — chrome gut-check passed (SideNav/theme-toggle/buttons/modals read as Switchboard in both
  themes). View BODIES are still old — that's P3.)*:
  - **P2a** — `../va-wt-sb-primitives` / `feat/sb-primitives`: restyle `BaseButton`, `BaseBadge`,
    `ReportsTabButton`, `VoipLogo`, modals (`Confirmation`/`Info`/`Notice`/`Preview`/`InvalidRows`),
    `ReportTable`. API/props/emits PRESERVED (visual-only).
  - **P2b** *(✅ MERGED `619ca93`, worktree+branch removed; diff reviewed — SideNav API/collapse/widths
    preserved)*: SideNav reskin + theme selector (segmented when expanded / cycle button when collapsed,
    wired to `useTheme`); NEW presentational `RunningHead.vue`, `KpiTile.vue`, `SlabRule.vue`,
    `TheTicker.vue`. **Prop APIs for P3:** `TickerItem = { sym; value; dir?: 'up'|'down'|'warn'|'accent'|
    'neutral' }`; `TheTicker(items, variant:'landing'|'portal'=portal, live?)` empty→quiet state;
    `RunningHead(left, right?, leftAccent?=true, #right slot)`; `KpiTile(label, value, sub?, tone?:'text'|
    'accent'|'warn'|'down'|'up'='text')`; `SlabRule(size?:1|2|3=1)`. TheTicker is NOT store-coupled — P3
    wires data (V2 portal KPIs / V1 landing mock crawl).
  - **P2a** *(✅ MERGED `5c93469`, worktree+branch removed; diff reviewed — APIs preserved across all 10
    files: BaseButton variants `primary`/`secondary`/`secondary-outline`/`destructive` + `small`/`standard`
    sizes intact; BaseBadge 7 variants; modals keep v-model/props/emits; visual-only)*: restyled
    `BaseButton`/`BaseBadge`/`ReportsTabButton`/`VoipLogo`/5 modals/`ReportTable`. Note: badge
    `success`/`warning`→amber `warn`, `violet` kept as legacy public variant; VoipLogo has ZERO call sites
    (markup change has no downstream impact).
  - Both frozen out of `tailwind.config.js`/`index.css`/`main.ts`/`App.vue`. P2 re-themes deferred surfaces
    too (expected, not divergence).
  - **⚠️ Pass-2 flag (pre-existing, NOT touched):** SideNav collapsed width is `80px` but `App.vue` offsets
    content `md:ml-[64px]` when collapsed (16px mismatch). App.vue is deferred → fix in Pass 2 shell rework.
- **P3 — Reskin the views** *(EXECUTION CHANGED 2026-05-28: owner chose the CONDUCTOR does it LIVE,
  view-by-view, with the chrome-devtools MCP at :5173 — NOT 3 parallel blind sub-agents. Reason: a visual
  reskin's real acceptance test is "looks right in both themes", which only the conductor/owner can see;
  sub-agents in worktrees can't run a dev server, so they'd reskin blind → expensive post-merge round-trips.
  Commit EACH view as finished (owner OK'd per-view commits to the integration branch).)*:
  - **V1 `HomeView`** (landing, forced light) — ✅ DONE + committed `df0640b`; regression-check GREEN;
    visually verified in chrome-devtools (ticker / running heads / dropcaps / accent rails; forced light via
    a `data-theme="light"` wrapper div). Screenshot carousel + shared `TheFooter` (deferred) preserved.
  - **V2 `UsView` + `USInsights`** (portal analyzer) — ✅ DONE + committed `c8e8204`; regression-check
    GREEN (build + integration; TS debt non-blocking). Coupled children all reskinned: `USContentHeader`
    (tab bar), `USOpportunityTable` (`accent` prop emerald/violet → warn/accent), `USFileUploads` +
    stepper (emerald Deck A / violet Deck B DROPPED → symmetric neutral dropzones, accent browse/drag,
    warn "uploaded", down "remove"), `USCodeSummary` (surfaces/borders/inputs/country tags), `USPricingReport`
    fallback. UsView gained portal `TheTicker` (live session KPIs, quiet pre-comparison) + `RunningHead` +
    kit 3-col stepper. USInsights: connected KPI slab grid (sign-based warn/accent tones), **coverage donut
    DROPPED**, distribution `Bar` chart fills `#34d399`/`#a78bfa` → theme-aware CSS-var reads (`--warn`/
    `--accent`/`--border`/`--text-faint`, recompute on theme flip). **Verified in chrome-devtools: UPLOAD
    state, dark + light, zero console errors.** ⚠️ Insights + Explorer **data-populated** states need
    UPLOADED DECKS + LERG → **OWNER gut-check pending** (conductor can't populate without test decks).
  - ⚠️ **Explorer body NOT yet reskinned** (out of V2's named scope): `USPricingReport` → `USDetailedComparisonTable.vue`
    (1690 lines) renders the granular Explorer grid + filter rail and is still emerald/zinc (legacy literals
    don't auto-retheme). The Explorer **tab** will read half-old until this lands. Recommend a **V2b** slice
    (or fold into V3) — flagged to owner.
  - **V3 `USRateSheetView`** (pricing studio body) — after V2; consider bundling `USDetailedComparisonTable` here.
  - **VERIFY (portal):** views are AUTH-GATED (`/usview` → `/login?redirect=/usview`). chrome-devtools is a
    FRESH browser session — the conductor must LOG IN (owner supplies local dev creds). Dev server must be
    running on :5173 in the conductor's main dir (`npm --prefix client run dev`); API :3000 confirmed up.
    `USInsights` only renders with uploaded decks + LERG loaded → **owner gut-checks the data-populated
    states**; conductor verifies the chrome / upload state / theme-flip.

### Token vocabulary for P2/P3 workers (from the P1 bridge)
- surfaces: `bg-canvas` (--bg) · `bg-surface` (--bg-elev) · `bg-row` · `bg-row-hover` · `bg-input`
- text: `text-fg` · `text-fg-dim` · `text-fg-faint` · `text-fg-mute`
- borders/rules: `border-line` · `border-line-strong` · `border-line-divider` · `rule`
- accent: `accent`/`accent-strong`/`accent-text`/`accent-soft`/`accent-mid`/`accent-ring`/`accent-ink`
- direction: `up`/`down`/`warn`/`info`/`violet` (+ `-soft`); legacy `fbBlack`/`fbWhite`/`ink`/etc auto-retheme.
- **RULE:** no `/opacity` modifiers on var() colors → use the pre-baked `-soft`/`-mid`/`-ring` tokens.
- **PORTAL:** positive/"Sell To" = `warn` (amber); negative/"Buy From" = `accent` (red); NO green/violet;
  destructive = `down`. **LANDING:** ticker uses `up`/`down` (green/red).
- fonts: headlines/data/labels/buttons = `font-display`/`font-mono` (Geist Mono); paragraphs = `font-sans`
  (Inter). Helper classes available in index.css: `.h-display/.h1/.h2/.h3/.eyebrow/.label/.kpi-value/
  .dropcap/.slab-rule{,-2,-3}/.brand-chip`.

### Resume (if conductor tab dies / new chat)
Confirm main dir on `feat/switchboard-reskin` @ `c8e8204`; `git log --oneline -3`; read this board; continue
from the ACTIVE slice (**V2b `USDetailedComparisonTable` (Explorer body) or V3 `USRateSheetView` next**). For
P3 the conductor edits views directly in the main dir (no worktrees)
and verifies via chrome-devtools at :5173. Ensure the dev server is up (`npm --prefix client run dev`); API
on :3000. Portal views need login — get local dev creds from the owner and log into the chrome-devtools
browser. Dev-auth origin is `localhost:5173` ONLY. **Owner is moving to a fresh YOLO-mode chat** (auto-accept
permissions) to cut prompt friction — that new chat IS the resuming conductor.

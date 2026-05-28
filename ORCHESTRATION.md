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

- **Conductor:** ✅ **Pass-1 MERGED to `main` @ `43cc3cd`** (no-ff merge, owner gut-check passed both themes
  2026-05-28; `regression-check` GREEN on `main`). Working dir now on `main` (`feat/switchboard-reskin` is
  merged — safe to delete). **`main` = `origin/main` = `651e699` (✅ PUSHED 2026-05-28 w/ owner OK);
  PROD STILL `8b696b7` (NOT deployed — manual Coolify action, push ≠ deploy).** NEVER deploy without explicit
  owner OK.
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
  - **V2b `USDetailedComparisonTable`** (Explorer body, 1690 lines) — ✅ DONE + committed `bc078b5` (owner
    chose "reskin now"). Granular grid + filter rail + summary cards retoken'd to Switchboard (visual-only;
    filter/sort/pagination/export logic untouched). File A pill=warn, File B=accent (matches USInsights);
    Export Data button → solid accent; sort/active states → accent; inputs/listboxes → bg-input + accent ring.
    `rounded-*` is already 0 globally (P1) and `font-secondary` auto-upgrades to Geist Mono, so only colors/
    surfaces/borders changed. regression-check GREEN. **Data-populated Explorer (needs uploaded decks) → OWNER
    gut-check** (conductor confirmed it compiles + the reskinned PreviewModal renders, but didn't drive a full
    222K-row upload — too token-heavy/flaky for the MCP).
  - **V3 `USRateSheetView`** (Pricing Studio, `/us-rate-sheet`) — ✅ DONE + committed `3e39d9d`. Page shell +
    `USRateSheetTable` (recipe builder / command bar / table / filter rail / pagination) + `pricing-studio/`
    {`PricingStudioMetricStrip`,`PricingOperationsPanel`,`OperationCard`} all retoken'd to the portal
    PricingStudioView (visual-only; pricing-engine/filters/freeze/pagination/export logic untouched). Palette
    map: op/Apply+Freeze/active = accent; markup & "modified" & export-ready & "data loaded" = warn;
    markdown = accent; **frozen/locked = info (blue)** — portal bans violet/green, so the violet "frozen"
    semantic moved to info. Added a `RunningHead`. **Verified in chrome-devtools: UPLOAD state, dark + light,
    zero console errors. regression-check GREEN.** ⚠️ Workspace state (recipe/table/operations, needs a loaded
    deck) → **OWNER gut-check**.
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
**▶ LATEST (2026-05-28):** Pass-1 ✅ + **Pass-2 ✅ MERGED to `main` (`origin/main` = `a919455`)** — footer/
masthead/dashboard/rate-gen-studio/legal/admin reskins + fixes. ⚠️ PROD still `8b696b7` (manual Coolify deploy
pending; next deploy ships studio + reskin together). **Auth screens ✅ reskinned on branch `feat/switchboard-auth`
(off `main` @ `a919455`, tip `26433d0`) — NOT merged, awaiting owner gut-check** (LoginPage/SignUpPage/SignInForm/
SignUpForm → VoipLogo mark, mono headings, tokenized inputs, theme-aware; verified dark+light, regression GREEN;
better-auth flows untouched). **Remaining Switchboard work: `AppMobileNav` + the App.vue shell / SideNav-width
(80px vs `md:ml-[64px]`) + deferred ticker placement.** New branches go off `a919455`, NOT the old pass2 tip.
History below is pre-merge (kept for reference).

**Pass-1 is DONE and MERGED to `main` @ `43cc3cd`** (foundation + shared + 4 views + Explorer body; owner
gut-check passed, regression GREEN). On a fresh chat: confirm `git branch --show-current` = `main`,
`git log --oneline -5`. Pass-1 ✅ PUSHED (`main` = `origin/main` = `73a65a3`). **Open (need owner OK):**
(1) manual **Coolify deploy** — PROD still `8b696b7` (push ≠ deploy); (2) delete the merged
`feat/switchboard-reskin` branch. **PASS-2 IN PROGRESS** on branch **`feat/switchboard-pass2`** (off `main`
@ `73a65a3`; conductor commits per-surface live, merge after owner gut-check). Done: ✅ **`TheFooter` `e1eabf5`**
(full-width flat editorial footer); ✅ **standardized `PageMasthead` `020a885`** — NEW
`components/shared/PageMasthead.vue` (ticker strip + RunningHead `SECTION N — TITLE` + mono h1 + subtitle +
slots), applied to every route with owner-chosen numbering **I–V** (I Overview/Dashboard, II US NPANXX, III
Repricing, IV Composition, V Admin-pending); **DashBoard fully de-greened** + USRateSheetView gained a live
pricing-session ticker. ✅ **Rate Composition Studio tab BODIES `1e711d9`** — `RateGenFileUploads` /
`RateGenSimulation` / `RateGenGeneratedDecks` retoken'd (visual-only). **Owner decision: provider identity =
mono/single-accent** — dropped the 5-colour rainbow (AVATAR_STYLES + simulation PALETTE): avatars are numbered
mono slabs, win-rate bars use one `bg-accent` fill (theme-aware). Section/scenario badges + active mode toggle
+ drag-active + focus rings + primary actions = accent; "uploaded" counter = warn; remove/error = down.
Verified in chrome-devtools both themes with 3 loaded test providers + a generated deck; regression-check GREEN.
**NOT-MERGED yet (awaits owner gut-check).** ✅ **Legal pages reskinned `3518e8c`** — `TandCView`/`PrivacyView`
tokenized to Switchboard (theme-aware via `data-theme`, NOT forced-light): `bg-canvas`/`text-fg`, Geist-Mono
headings, Inter body, accent eyebrow + slab rule; fake "BoltIcon + VOIP Accelerator" pill → `VoipLogo` mark
(first real consumer of VoipLogo); in-content "View Privacy Policy" button → in-app `RouterLink` (was a prod
absolute URL + new tab); prose `<style>` blocks scoped + retokenized, dropped `prose-invert` + the raw
`text-white` that broke light mode. Verified both themes, regression GREEN. ✅ **Admin route reskinned `fb94850`** — `/admin`: AdminView got the
standardized PageMasthead (Section V — Admin); `UnifiedNANPManagement` + `UserManagement`/`UserTable`/
`UserRoleSelector`/`UserStatusToggle` tokenized (admin comps used raw `gray-*`/`white` that DON'T retheme → broke
in light mode; ~150 swaps). Off-palette → portal: LERG category stats (green/blue/amber/violet) → mono `text-fg`;
status boxes success→warn, info→`info`(blue), error→down; category badge `violet`→`neutral`; user avatar →
`bg-accent-soft` + accent ring/initials (matches dashboard avatar); Active status dot/toggle green→warn; admin
role=warn, user=neutral. Verified BOTH themes, regression GREEN. ✅ **Follow-up cleanup `93a3464`** (owner asked): fixed the
`lergStore` ReferenceError (UnifiedNANPManagement.loadData used undefined `lergStore` → now `store`; **console on
/admin is now CLEAN**); deleted dead `NANPDiagnostics.vue` + `PerformanceComparison.vue` (imported nowhere);
removed AdminView's unused `edgeStatusClass`/`dbStatus` computeds + `DbStatus` interface + the now-unused
`pingStatus` destructure. regression GREEN, verified in-browser. Remaining Pass-2: auth pages (login/signup — BoltIcon still emerald),
`AppMobileNav`, App.vue shell + the deferred ticker placement / SideNav-width (80px vs `md:ml-[64px]`) fix.
**Two known-out-of-scope items seen during rate-gen verify (NOT fixed):** (a) `TestDataLoader.vue` still uses
yellow/gray literals — dev-only (`?testMode=true` / `VITE_ENABLE_TEST_DATA`), never ships to prod; (b) a
pre-existing Vue dev warning — `variant="destructive"` passed to the reskinned `ConfirmationModal` (now a
teleport root) in `RateGenFileUploads`; benign, predates this reskin (that block untouched).
**Two FUNCTIONAL fixes also landed on this branch (owner-requested, NOT reskin — will merge to main with Pass-2):**
✅ **`0bedf79`** — removed the "Data starts on line" control from the shared `PreviewModal` (affects ALL mapping
modals: US/rate-gen/AZ/admin-LERG). Safe because upload parsers reject invalid/header rows via `transformRow`
regardless; `startLine` stays pinned to 1, prop/emit plumbing left intact (avoids churning 5 callers + services).
✅ **`ba837f9`** — footer Terms/Privacy links now navigate in-app (dropped `target="_blank"` → SPA nav, owner
chose same-tab over new-tab). **Root cause found + DEFERRED (owner's call):** `<RouterLink target="_blank">`
forced a fresh full-page load, and on a fresh/deep-link load an *authenticated* user gets bounced to `/dashboard`
by a redirect race — the nav guard pauses the deep-link while awaiting auth init, and `App.vue`'s `watchEffect`
redirects the unresolved `/` START_LOCATION (transitional) to dashboard. This breaks ALL deep-links/bookmarks to
non-dashboard routes for authed users (same root as the known "/usview bounces until LERG loads"). Owner opted for
the footer workaround now; the App.vue race is the real fix when someone wants deep-linking/bookmarks to work.
**Verify tip:** to reach populated rate-gen states, SPA-nav with the router (`#app.__vue_app__.config.
globalProperties.$router.push('/rate-gen/us?testMode=true')`) AFTER the dashboard mounts LERG — a full reload to
that URL bounces to /dashboard (guard runs before LERG loads). Then the dev TestDataLoader's "3 Providers" button
populates everything in-memory.
Reusable reskin facts: `rounded-*` already resolves to 0 globally (P1 config) + `font-secondary` auto-upgrades
to Geist Mono, so a reskin is mostly color/surface/border token swaps; portal palette = warn(amber)=positive/
Sell/done, accent(red)=negative/Buy/active, info(blue)=frozen/locked, down=destructive, NO green/violet.
Sample US decks for data-state verification: `client/src/data/sample/UStest.csv` + `UStest1.csv` (map
prefix→NPANXX, rate(inter)→Inter, the two intrastate cols → Intra + Indeterminate). For P3+ the conductor
edits views directly in the main dir (no worktrees) and verifies via chrome-devtools at :5173
and verifies via chrome-devtools at :5173. Ensure the dev server is up (`npm --prefix client run dev`); API
on :3000. Portal views need login — get local dev creds from the owner and log into the chrome-devtools
browser. Dev-auth origin is `localhost:5173` ONLY. **Owner is moving to a fresh YOLO-mode chat** (auto-accept
permissions) to cut prompt friction — that new chat IS the resuming conductor.

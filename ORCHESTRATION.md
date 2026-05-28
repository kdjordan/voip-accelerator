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

- **Conductor:** sits on `feat/rate-gen-studio` @ `a468719` (integration branch for the Rate Composition
  Studio / Screen-3 rework — scope LOCKED in `docs/adr/0008` + `CONTEXT.md`; slices land here, `main`
  stays pristine at `a4d137d` until the whole studio is done + gut-checked).
- **Last prod deploy:** `8b696b7` (2026-05-27). `main` = `origin/main` = `a4d137d` (docs only, undeployed).
- **Active tasks:** none in flight. **Waves 1–2 ✅ DONE** (A+B+C merged; worktrees/branches cleaned). HEAD `9ee0662`, regression-check GREEN + 94 unit.

  | wave | task | status |
  |------|------|--------|
  | 1 | A — upload validation (reject inter/intra ≤0) | ✅ merged |
  | 1 | B — engine core (pure in-mem `selectLeanRecords`, drop IDB persist, `rate-gen-aggregates.ts`) | ✅ merged |
  | 2 | C — `RateGenUSView` → 3 free-nav tabs (`activeTab` ref; Upload wired, Sim/Decks placeholders; effective-date ref + How-LCR `<details>` on Sim tab; strategy/markup + RateGenResults/RateGenConfiguration UNWIRED, files intact) | ✅ merged |
  | 3 | D — Simulation Preview sandbox (sample, scenarios ≤4, compare, commit) | ⬜ READY (C done) |
  | 3 | E — Generated Decks tab + 3 outputs (Final CSV dialog, Route CSV, Summary PDF) | ⬜ READY (B done) |

- **Wave-3 mode decision pending owner:** run **D** as a live cmux tab (steer sandbox UX) or bg sub-agent? E = bg sub-agent. D & E both edit `RateGenUSView` (tab bodies) → if parallel, watch for conflict; safer to run D then E, or split cleanly (D owns Sim tab body, E owns Decks tab body).
- **Hooks for D/E:** sandbox runs `selectLeanRecords(sample, …)`; Decks read `service.getGeneratedRecords(deckId)`; aggregates in `utils/rate-gen-aggregates.ts`; effective-date ref already on the Sim tab. Orphan to retire in D/E: `RateGenHeader.vue` (now unused).

- **⚠️ Interim state after Wave 1:** generation now holds rates IN MEMORY only (`service.getGeneratedRecords(deckId)`) and no longer writes IndexedDB. The LEGACY `RateGenResults` + `RateGenExportModal` still read the now-unwritten IDB tables → they show/export EMPTY at runtime. **Expected** — those are retired/replaced in slices D/E. Don't gut-check generation output until D/E land. Slice E reads from `getGeneratedRecords(deckId)`.

- **Waves:** 1 = A+B (running). 2 = C (tab shell). 3 = D (sandbox) + E (decks/outputs). Visual reskin
  (Switchboard) deferred until functionality baked — separate track/chat.
- **Merge note:** A & B touch the SAME file (`rate-gen.service.ts`) in different regions — merge A first,
  then B, watch for a small conflict.

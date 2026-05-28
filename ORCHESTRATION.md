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

- **Conductor:** sits on `main` @ `8b696b7`.
- **Last prod deploy:** `8b696b7` (2026-05-27).
- **Active tasks:** none in flight.

  | task | branch | worktree | mode | status |
  |------|--------|----------|------|--------|
  | _(none)_ | | | | |

- **In progress elsewhere:** rate-gen rework continues on `feat/rate-gen-studio` (see `rate-gen-rework`
  memory) — owner-driven, step-wise.

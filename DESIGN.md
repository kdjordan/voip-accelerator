# DESIGN.md — Portal Design System

The single source of truth for styling authenticated feature screens. Brand voice,
messaging, and the landing page live in `.impeccable.md`; **colors/surfaces/spacing for
the app live here.**

**Exemplars (already shipped, owner-approved — match their density of accent):**
`/usview` (US Reporting, `components/us/`) and `/us-rate-sheet` (Pricing Studio,
`components/rate-sheet/us/`). When unsure, copy what those screens do.

---

## ⭐ Restraint is the rule (read first)

Emerald is a **sparing accent, not a theme.** Default text is zinc/white; default surfaces
are ink/glass. Reach for emerald **only** for:

- the one primary action per view,
- the active nav/tab/segment state,
- links,
- a single accent icon or eyebrow.

If a screen reads as emerald-heavy, it is wrong — pull back to zinc/white. (The legacy app
leaned hard on the `accent` token; do not preserve that placement — actively reduce it.)

---

## The accent: `emerald-*` literals only

There is **one** way to write the accent green: the Tailwind `emerald-*` scale.

- ✅ `text-emerald-400`, `bg-emerald-400/10`, `border-emerald-400/40`, `ring-emerald-400/60`
- ❌ **Never** `text-accent` / `bg-accent` / `border-accent` in components.

`accent` (`#34d399` = emerald-400) survives in `tailwind.config.js` **only** for the
status-pulse keyframes. It is identical in hue to `emerald-400`, so the two class names
were rendering the same color under two names — that ambiguity is banned here.

### emerald-400 vs emerald-300

- **`emerald-400`** = the resting accent (links, accent text/icons, primary button fill, borders).
- **`emerald-300`** = the *brighter* step, used for: **hover** on an emerald element
  (`hover:text-emerald-300`), the **active/selected** state (`bg-white/[0.06] text-emerald-300`),
  and accent text sitting **on an emerald-tinted fill** (`bg-emerald-400/10 … text-emerald-300`).

---

## Tokens (`tailwind.config.js`)

| Token | Value | Use |
|---|---|---|
| `ink` | `#08090A` | page canvas |
| `ink-raised` | `#0C0F0E` | modals / raised panels |
| `emerald-400` | `#34d399` | resting accent |
| `emerald-300` | `#6ee7b7` | hover / active / on-tint accent text |
| `warning` (amber) · `info` (blue) · `destructive` (rose) | — | semantic only |

Do **not** use `bg-gray-700/800/900` or `text-fbWhite` (slate) on app screens — those are the
legacy palette (lighter, blue-tinted) and are the source of cross-screen drift.

### Surface ladder (translucent white over `ink`)
`bg-white/[0.02]` (base panel) → `bg-white/[0.03]` (inputs, cells) →
`bg-white/[0.05]`–`[0.06]` (hover rows, active segments). Borders: `border-white/[0.07]`
(cards), `border-white/10` (inputs).

### Text ladder
`text-white` (headings, KPI values) → `text-zinc-300` (body) → `text-zinc-400` (secondary)
→ `text-zinc-500` (labels, eyebrows). Numerals/codes use `font-secondary` (mono).

---

## Class recipes (copy-paste)

- **Page:** `bg-ink text-zinc-300`
- **Card / panel:** `rounded-2xl border border-white/[0.07] bg-white/[0.02]` (raised: swap fill → `bg-ink-raised`)
- **Section header:** eyebrow `text-xs font-secondary uppercase tracking-wider text-zinc-500`; title `text-white font-semibold`
- **Input:** `bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-transparent`
- **Table:** container `rounded-xl border border-white/[0.07] overflow-hidden`; thead `text-[11px] uppercase tracking-wider text-zinc-500`; rows `divide-y divide-white/[0.06] hover:bg-white/[0.02]`; numeric cells `font-secondary`
- **Stat / KPI tile:** `rounded-lg border border-white/[0.07] bg-white/[0.02] p-3`; label `text-[10px] uppercase tracking-wider text-zinc-500`; value `font-secondary text-white`; delta emerald (good) / rose (bad)
- **Secondary/ghost accent button (on-tint):** `inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-2.5 text-sm font-medium text-emerald-300 hover:bg-emerald-400/20`

## Shared primitives — use, don't re-skin

`BaseButton` (primary = solid `bg-emerald-400 text-ink`; secondary = white/10 ghost;
destructive = rose), `BaseBadge` (`bg-{c}-400/10 text-{c}-300 ring-1 ring-{c}-400/30`),
modals (`ConfirmationModal`/`InfoModal`/`NoticeModal` — `bg-ink-raised border-white/10`,
backdrop `bg-black/60 backdrop-blur-sm`), `ReportsTabButton` (active = emerald), progress
indicators (emerald fill on `bg-white/10` track).

## Motion & semantics

Subtle fades + hover states only; gate non-trivial animation on `prefers-reduced-motion`.
Color semantics: emerald = positive/primary, rose = negative/destructive, amber = warning,
blue = info.

---

## Conformance status

| Screen | State |
|---|---|
| `/usview` (`components/us/`) | ✅ on-system (3 stray `text-accent` in `USCodeSummary.vue` to clean up) |
| `/us-rate-sheet` (`components/rate-sheet/us/`) | ✅ on-system |
| `/rate-gen` (`components/rate-gen/`) | ⬅ migrating to this spec (Rate Composition Studio rework) |
| A-Z (`components/**/az/`) | 🧊 legacy palette, **frozen** — A-Z is deactivated; do not touch |

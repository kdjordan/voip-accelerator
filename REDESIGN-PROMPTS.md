# Portal Redesign — Worker Prompts

Full visual redesign of the authenticated portal to match the new landing page
(emerald-400 on near-black `ink`, glass cards, refined type). Decisions: accent token →
emerald-400 app-wide; parallel worker sessions; pilot = US Reporting (`/usview`).
Background lives in auto-memory: **"Portal redesign"**, **"HomeView facelift prototype"**,
**"US NPANXX focus decision"**.

## Workflow

1. Run **Prompt 0** (design-system foundation) → it must land first; everything depends on it.
2. Ping the conductor → review + merge P0 to `main`, but **hold the prod deploy** (no point
   shipping a recolored-but-not-redesigned app).
3. Run **Prompt 1** (pilot `/usview`) off the updated `main` → review the design language.
4. Once confirmed: deploy P0+P1 together, then the conductor writes the **Phase 2/3** parallel
   batch (US Rate Wizard, Rate Generation, file uploads, PreviewModal, Admin, shell/nav,
   Dashboard) — held until now because the pilot may adjust the system.
5. Phase 4: screenshot the polished `/usview` → replace the fictional dashboard mock on the
   live landing page.

Standard rules for every prompt: `main` is LIVE PRODUCTION (manual Coolify deploy). Branch off
`main`, run `npm run regression-check` in `client/`, leave the branch for review — do NOT merge
or deploy (the conductor merges + deploys after review). Dev server is always running — don't
start it. TS type-check has known pre-existing debt (non-blocking).

Heaviest components (restyle VISUAL layer only — never touch edit/sort/parse logic):
`USRateSheetTable` 2090, `USDetailedComparisonTable` 1644, `UnifiedNANPManagement` 1001,
`PreviewModal` 735, file uploads ~1000 each.

---

## Prompt 0 — Design-system foundation (must land first)

```
In the voip-accelerator repo, lay the design-system foundation for a full portal redesign
to match the new landing page. Vue 3 + TS + TailwindCSS; client code under client/src.

Goal: converge the authenticated app's look with the new landing (emerald on near-black,
glass cards, refined type). This phase changes TOKENS + SHARED PRIMITIVES + writes a design
spec — it does NOT redesign individual feature screens (later phases do, using your spec).

Branch off `main` (e.g. feat/redesign-p0-design-system).

1. Tokens — client/tailwind.config.js:
   - Redefine `accent` from hsl(160 100% 40%) to Tailwind emerald-400 `#34d399`.
   - Update `accent-background` to `rgb(52 211 153 / 0.2)`.
   - Keep `ink` (#08090A) and `ink-raised` (#0C0F0E) (already present). Leave fbBlack/fbWhite/
     fbHover and the semantic warning/info/destructive tokens as-is (still referenced widely).
   - Note: changing `accent` recolors `bg-accent`/`text-accent`/the status-pulse keyframes
     app-wide — that's intended. The landing uses literal emerald-400, so it's unaffected;
     shared TheFooter uses `accent` (its link shifts to emerald — fine).

2. Restyle the SHARED primitives to the new language. KEEP each component's existing props/API
   identical (only change rendered classes), so all consumers keep working:
   - client/src/components/shared/BaseButton.vue — primary: `bg-emerald-400 text-ink font-semibold
     hover:bg-emerald-300 rounded-lg`; secondary: `border border-white/10 text-zinc-200
     hover:bg-white/[0.05] rounded-lg`; secondary-outline: similar ghost; destructive: `bg-rose-500/15
     text-rose-300 ring-1 ring-rose-400/30 hover:bg-rose-500/25`. Preserve sizes/loading/icon.
   - client/src/components/shared/BaseBadge.vue — variant pattern `bg-{c}-400/10 text-{c}-300 ring-1
     ring-{c}-400/30` (accent→emerald, info→blue, success→emerald, warning→amber, destructive→rose,
     violet, neutral→zinc).
   - Modal shells: ConfirmationModal.vue, InfoModal.vue, NoticeModal.vue — panel `bg-ink-raised
     border border-white/10 rounded-2xl`, backdrop `bg-black/60 backdrop-blur-sm`, headings white,
     body zinc-300/400.
   - ReportsTabButton.vue — active: emerald text + `bg-emerald-400/10` + emerald underline/indicator;
     inactive: zinc-400 hover white.
   - Progress indicators (UploadProgressIndicator, RealTimeProgressIndicator) — emerald fill on white/10 track.

3. Document the system so later phases are consistent. Add a `## Portal Design System` section to
   `.impeccable.md` with copy-paste class recipes:
   - Page: `bg-ink text-zinc-300`
   - Card/panel: `rounded-2xl border border-white/[0.07] bg-white/[0.02]` (raised: `bg-ink-raised`)
   - Section header: eyebrow `text-xs font-secondary uppercase tracking-wider text-zinc-500`, title `text-white font-semibold`
   - Input: `bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-500
     focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-transparent`
   - Table: container `rounded-xl border border-white/[0.07] overflow-hidden`; thead `text-[11px]
     uppercase tracking-wider text-zinc-500`; rows `divide-y divide-white/[0.06] hover:bg-white/[0.02]`;
     numeric cells `font-secondary`
   - Stat/KPI tile: `rounded-lg border border-white/[0.07] bg-white/[0.02] p-3`; label `text-[10px]
     uppercase tracking-wider text-zinc-500`; value `font-secondary text-white`; delta emerald (good) / rose (bad)
   - Semantics: emerald=positive/primary, rose=negative/destructive, amber=warning, blue=info
   - Motion: subtle fades, always gated on `prefers-reduced-motion`

Verify: `npm run regression-check` in client/ passes. Spot-check 2-3 screens in the browser (dev
server is always running — don't start it; just load them) to confirm the accent flip looks right
and nothing obviously broke. The TS type-check has known pre-existing debt (non-blocking).

Rules: `main` is LIVE PRODUCTION (manual Coolify deploy). Branch off main, do the work, leave it
for review — do NOT merge or deploy.
```

---

## Prompt 1 — Pilot: redesign US Reporting (`/usview`) — run after Prompt 0 is merged to main

```
In the voip-accelerator repo, redesign the US Reporting analyzer screen to the new design system.
This is the PILOT for a full portal redesign — make it exemplary; it sets the bar for the rest.

Prerequisite: the design-system foundation (Phase 0) is already merged to `main` — the
`accent` token is now emerald-400 and the shared primitives are restyled. READ the
`## Portal Design System` section of `.impeccable.md` and follow those recipes exactly.

Branch off `main` (e.g. feat/redesign-p1-usview).

Surface = the US Rate Deck Analyzer at `/usview`. Files:
- client/src/pages/UsView.vue (thin wrapper)
- client/src/components/us/USContentHeader.vue (Files / Code / Pricing tab switcher)
- client/src/components/us/USFileUploads.vue (~996 L — drag-drop upload, validation)
- client/src/components/us/USCodeReport.vue → USCodeSummary.vue (~856 L) +
  USDetailedComparisonTable.vue (~1,644 L — the big sortable/filterable comparison table)
- client/src/components/us/USPricingReport.vue

Apply the design system: ink page bg, glass cards, the table recipe (uppercase zinc thead,
white/[0.06] row dividers, hover, font-secondary numerics), emerald for positive/margin and rose
for negative deltas, the input/stat-tile recipes, restyled tabs, subtle motion w/ reduced-motion.
Aim for the polish of the landing page's dashboard mock — this view is what we'll screenshot for
the landing later.

CRITICAL: restyle the VISUAL layer only. Do NOT change parsing, sorting, filtering, pagination,
the comparison calculations, or any store/worker interaction. Same data, same behavior, new look.
Use the shared BaseButton/BaseBadge/modal primitives rather than re-rolling buttons.

Verify: `npm run regression-check` in client/ passes. Load `/usview` in the browser (dev server is
always running) and click through Files/Code/Pricing with a sample deck to confirm behavior is
unchanged and it looks right. TS type-check has known pre-existing debt (non-blocking).

Rules: `main` is LIVE PRODUCTION (manual Coolify deploy). Branch off main, leave it for review —
do NOT merge or deploy.
```

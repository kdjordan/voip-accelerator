# Rate Composition Studio — sample-based simulation sandbox, session-only decks

The rate-deck generator (`/rate-gen/us`) becomes a **3-tab workspace** — Upload → Simulation Preview → Generated Decks — replacing the old linear "upload → settings → results" stepper. The **Simulation Preview** tab is a *scenario sandbox*: build up to four **scenarios** (each a `{LCR strategy, markup}` pair) and preview each against a **fixed random sample** of the uploaded prefixes (default 5,000), compare them side-by-side, then commit one or more to a full generate. A committed **generated rate deck** is held **in memory for the session only** — generation no longer persists rates to IndexedDB. Terms in [[CONTEXT.md]] (scenario, simulation sample, generated rate deck, win rate, single-sourced prefix).

This is the "functional" half of the rate-gen rework; the **visual reskin is deliberately deferred** until functionality is fully baked, and will ride on the in-progress *Switchboard* design system (not the current emerald palette) — see the design-system folder at repo root.

## Why a sample-based sandbox

- The product question is "which strategy/markup should I ship," which is a **comparison**, not a single run. Forcing a full commit before you can see an outcome (today's flow) inverts that.
- Running LCR over the full ~150–200K-prefix union for every tweak of every candidate is wasteful when a random sample answers the same question instantly. The **same** sample is frozen across all scenarios in a comparison so LCR1-vs-LCR2 is apples-to-apples, not two different random draws.
- The split that makes this honest: scenario-**independent** figures (total prefixes, single-sourced count) are computed **exactly** from the full provider data; only scenario-**dependent** figures (win-rate-by-type, providers-used, avg rates after markup) are sampled, and they become exact when a scenario is committed to a full generate.

## Why session-only, no IndexedDB persistence

- The expensive part of `generateRateDeck` was never the LCR math — it was writing ~200K generated records back to IndexedDB (~14s, per [[pricing-studio-worker-decision]]). **Dropping persistence deletes that cost**; a full generate collapses to the in-memory selection pass (a few seconds).
- Generated decks are **cheap to regenerate** from the provider decks (which *do* stay in IndexedDB — they're slow to rebuild). Losing them on reload is acceptable; persisting them is not worth the write cost or the lifecycle.
- The current code already writes generated rates to IndexedDB but **never rehydrates** the deck list — so today's writes are effectively orphaned storage. Session-only resolves that leak by simply not writing.

## Why no "uncovered" KPI

- The LERG in this app is **NPA-level** (it categorizes area codes; it does not enumerate all valid 6-digit NPANXX). There is therefore no reference universe larger than the uploaded decks to measure "uncovered" against.
- With "total prefixes" defined as the union of selected decks, and partial-rate rows rejected at upload (below), **a generated deck covers its universe by definition** — an "uncovered" count would always be 0. It is dropped; **single-sourced** (prefixes only one provider quotes) is the coverage signal instead.

## Considered and rejected

- **Keep the full-run-then-view flow** (today). No comparison loop; you commit before you can judge.
- **Persist generated decks to IndexedDB and rehydrate them.** Pays the ~14s write and a delete/cleanup lifecycle for durability the user said they don't need — decks regenerate in seconds.
- **A "target footprint" deck to give "uncovered" meaning** (upload the prefixes you *need*; uncovered = those no vendor quotes). Genuinely useful, but it's a new input type and net-new scope — deferred, not adopted.
- **Provider-distribution donut as the headline viz.** Redundant — its interstate share is just the interstate column of win-rate-by-type, which is the primary lens ("how the rates work" per jurisdiction). Donut dropped.

## Consequences (engine changes, test-first)

- **Upload validation tightens** (Screen 1 slice): reject any row with `rateInter <= 0` OR `rateIntra <= 0` → routed to the existing invalid-rows UI; indeterminate still derives from interstate. Net effect: every shipped prefix is fully priced, so the sandbox has no "None"/zero-rate edge cases. (Today only all-zero rows are rejected.)
- **`generateRateDeck` drops `storeDeckMetadata`/`storeGeneratedRates`**; committed decks live in memory keyed by deck id. Each record is **lean** — prefix, three final (post-markup) rates, the **three per-rate-type winner names** (needed for the Route Distribution CSV), and the markup — with the heavy per-record `debug` block discarded after aggregation.
- **New aggregates** (pure functions over the records, populating the currently-dead `RateGenAnalytics`): win-rate by rate type (primary), single-sourced count, providers-used, avg inter/intra/indet after markup.
- **Memory footprint**: 2–3 committed decks × ~200K lean rows ≈ ~100 MB. Acceptable for a session; concurrent generated decks are **capped at 3**, sandbox scenarios at **4**.
- **Outputs (per deck)**: Final Rate Deck CSV (keeps the old format-options as a compact download dialog — the export *modal wizard* is retired, its format logic kept); Route Distribution CSV (new, 3-column per-jurisdiction); Build Summary PDF (new `utils/rate-gen-summary-pdf.ts` mirroring the existing `pricing-audit-pdf.ts` — **no new dependency**: `jspdf` + `jspdf-autotable` already ship).
- **Retired components**: `RateGenResults`, `LCRValidationModal` (its `debug.selectedRates` data now powers the win-rate sandbox), and the export modal wizard (`RateGenExportModal` + Filters/FormatOptions/Preview).
- **Reversal** is mechanical for persistence (re-add the two IndexedDB writes + a rehydrate-on-mount); the tab/sandbox shape is a larger rework to undo.

# Cross-module rate deck hand-off — push a deck downstream as a decoupled snapshot

A US rate table loaded or produced in one module can be **handed off** into another so the same data flows Compose → Adjust → Compare without a re-export/re-upload round-trip. v1 supports three directed edges:

1. **Composition Studio (generated deck) → Adjuster** — fine-tune a generated deck's rates.
2. **Adjuster (current sheet) → Analyzer** — promote a worked deck into a comparison.
3. **Composition Studio (generated deck) → Analyzer** — compare a generated deck directly, no adjust step.

The portable unit is the **rate deck hand-off** (see [[CONTEXT.md]]): NPANXX-keyed interstate/intrastate/indeterminate rates, `npa`/`nxx`/`stateCode` re-derived from the LERG on landing. It is a **snapshot of effective rates at the moment of transfer**, decoupled from its source.

## Why push + auto-navigate (not a pull picker)

- Generated decks live **in memory, session-only** (the rate-gen service `Map`, per [[0008-rate-composition-studio-simulation-sandbox]]). A *pull* picker on the Adjuster/Analyzer would have to reach across stores to enumerate sources and would be empty after any reload — it reads as broken.
- A *push* acts on the deck the user is already looking at, then routes them to the destination ready to work. It matches the mental model ("take *this* one and send it onward") and sidesteps the session-only enumeration problem.
- Action lives on the source: generated-deck cards get **Send to Adjuster / Send to Analyzer**; the Adjuster gets **Send to Analyzer**.

## Why a decoupled snapshot (lossy, materialized, no live link)

- The rates carried are **materialized**: any LCR strategy, global/fixed markup, or per-state/metro adjustment is already baked into the numbers by the time the deck sits in a module. So **no re-appliable markup/strategy/rule metadata travels** — only the resulting rates. A deck generated with markup lands already marked-up.
- The hand-off is a **one-time copy**, not a live binding. If the source is later regenerated or re-adjusted, the landed copy is **stale** and does not auto-update. A lightweight provenance line (`Loaded from Composition Studio · LCR2 · Position · N prefixes`) is shown for orientation, but there is **no staleness tracking or re-sync**.
- Each destination keeps its existing capacity rules: the **Adjuster holds one** sheet (landing overwrites it, behind a confirm); the **Analyzer holds two** comparison slots (landing fills one; the user supplies the other; the comparison runs only when both are present, per the existing `isFull`).

## Why it bypasses the upload/mapping UI

- Source decks are already structured, clean, NPANXX-keyed data — generated decks are guaranteed fully-priced ([[0008-rate-composition-studio-simulation-sandbox]]); the adjusted sheet came from a validated upload. So a hand-off **skips the file picker, column-mapping `PreviewModal`, and invalid-rows step** and loads directly into the destination store/Dexie.
- Landing **reuses existing paths**: `stateCode` via the LERG NPA lookup (`'N/A'` on miss, exactly as upload does); big writes (~200K rows into the Adjuster's Dexie) go through the same `bulkPut` + progress UX as a normal upload (the known ~14s write).
- The Adjuster-as-source sends its **applied** rates (the current Dexie rows). Un-applied recipe inputs are not sent — they aren't real until Applied.

## Considered and rejected

- **Pull picker on the destination.** Cleaner conceptually, but empty after reload for session-only generated decks — feels broken. Rejected for push.
- **Carry re-appliable markup/strategy metadata.** Would let the destination re-derive rates, but duplicates engine logic across modules and contradicts "materialized rates." Rejected — numbers only.
- **Live link / re-sync between source and landed copy.** Real lifecycle cost (change detection, conflict UX) for durability the flow doesn't need — decks regenerate cheaply. Rejected for a one-time snapshot + provenance label.
- **Edges 4 & 5 (re-inject an adjusted/generated deck into the Composition Studio as a provider deck).** Distinct semantics (a *provider deck*, not a sheet), power-user. Deferred, not adopted.
- **Analyzer as a source.** It produces a comparison report, not a single result deck. Destination-only in v1.

## Consequences

- A shared, source-agnostic hand-off payload + a small transfer service that reads the source's rows, normalizes (strip leading `1`, split npa/nxx, derive stateCode), and writes into the chosen destination via its existing ingest path.
- Three "Send to…" entry points (2 on generated-deck cards, 1 on the Adjuster), each routing to the destination after handing off.
- Collision UX: Adjuster overwrite-confirm; Analyzer fill-empty-slot or pick-which-to-replace when both full.
- **Reversal** is mechanical — the entry points and the transfer service are additive; removing them leaves each module's existing upload path untouched.

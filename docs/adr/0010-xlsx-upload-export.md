# XLSX upload + export via a format-transparent tabular-IO layer

Users can upload `.xlsx` anywhere `.csv` is accepted and export to `.xlsx` alongside the existing CSV outputs, across the three active US surfaces: the **Analyzer** (`/usview`), the **Adjuster / Pricing Studio** (`/us-rate-sheet`), and the **Rate Composition Studio** (`/rate-gen/us`). A-Z (frozen behind the US-NPANXX pivot) and the admin LERG flow (single operator, stays CSV) are **out of scope** for v1 — reversible additions later.

Format is **transparent per file**: a user can compare a CSV against an XLSX in the Analyzer and it "just works." A single shared module routes by file type; the existing column-mapping, validation, NANP-categorization, and Dexie-write pipeline is **untouched**.

## Why `read-excel-file` + `write-excel-file` (not SheetJS or ExcelJS)

- **`xlsx` (SheetJS) — rejected on supply-chain grounds.** SheetJS stopped publishing to npm years ago; the registry version is stale and carries known CVEs (prototype pollution, ReDoS). The maintained build is CDN-only (a non-npm tarball), which fights the repo's install gate even harder.
- **`exceljs` — rejected as dead weight.** One maintained dep that reads+writes, but ~hundreds of KB minified; its value is rich styling/merged-cells/streaming we'd never use. Our data is plain tabular (NPANXX + three rates); bloating a deliberately chunked + Terser'd client bundle isn't worth it.
- **`read-excel-file` + `write-excel-file` — chosen.** Purpose-built for plain tabular, maintained on npm, light (tens of KB), and **browser + web-worker** capable via `fflate`. Two packages = two install reviews, accepted.
- **Vetting (per the repo install-safety flow):** GuardDog flags `npm-api-obfuscation` on both — all hits are the Babel `_iterableToArrayLimit` destructuring helper (`r["@@iterator"]`), a known false positive, not real obfuscation. Neither package has `preinstall`/`install`/`postinstall` scripts (only maintainer-side `prepublishOnly`); we still install with `--ignore-scripts`. Transitive deps are purpose-fit (`fflate`/`@xmldom/xmldom`/`unzipper` read, `archiver-node`/`fflate` write); the Node-oriented zip deps must stay out of the browser bundle by importing the `/web-worker` entry. **Age gate:** at install time, pin to a version ≥14 days old or do a scoped per-command bypass — owner's explicit call then.

## Why one shared tabular-IO layer

- `papaparse` is currently called inline in ~5 places, each re-doing parse + Blob-download. Adding xlsx the same way duplicates format-detection 5× per direction.
- A single module — `parseTabularFile(file) → Promise<string[][]>` and `writeTabularFile(filename, headers, rows, format)` — imports the new deps in exactly one place, detects format once, and leaves the risky downstream logic alone.
- `parseTabularFile` **normalizes xlsx typed cells back to strings** so its output is byte-identical in shape to today's papaparse `header:false` rows (`string[][]`, row 0 = headers). Care points: numbers without scientific notation or float-precision drift (`0.008`, not `8e-3`), NPANXX as plain digits, dates rendered to the expected string. → the column-mapping modal, rate validation, and chunked Dexie writes need **zero** changes.

## Why worker-parsed XLSX

- CSV streams (papaparse `step`) so the tab stays responsive. An `.xlsx` is a zip that must be fully decompressed + XML-parsed into memory at once — on a 200K-row deck (Adjuster) or 5×50K (Rate Composition Studio) that's seconds of synchronous work → a frozen tab (the exact failure the Pricing Studio worker rework fixed, [[0008-rate-composition-studio-simulation-sandbox]] / pricing-studio-worker-decision).
- So xlsx parsing runs through `read-excel-file`'s **web-worker** entry; CSV stays main-thread/streaming. `parseTabularFile` already returns a Promise, so the worker is hidden from callers. **UI never freezes** is a hard rule.

## Why the export default is derived from the source format

- Upload is invisible, but an export produces a specific file, so the user must choose — via a compact **`CSV | XLSX` toggle** per export area (no duplicate buttons; PDFs are always PDF and ignore it). XLSX export content is **identical** to the CSV (same headers/rows), single sheet, `.xlsx`.
- The toggle's **default is inferred from the uploaded source format(s)**: all-XLSX → XLSX, all-CSV → CSV, mixed/unknown → CSV; always overridable. This requires tracking each uploaded file's source format per surface. Edge cases: the Rate Composition Studio **generated deck** (computed) inherits the default from its **provider decks**; an Adjuster deck arriving via the **cross-module hand-off** ([[0009-cross-module-rate-deck-handoff]]) has no source file → defaults CSV.

## Considered and rejected

- **`xlsx`/SheetJS, ExcelJS** — see above (supply-chain; bundle weight).
- **Per-surface inline xlsx** (no shared layer) — duplicates detection + the new dep across ~8 sites. Rejected for the single module.
- **Sheet picker** — real decks are single-sheet; v1 reads the **first sheet** and errors with guidance if its first sheet is empty. A picker is deferred.
- **Duplicate `…CSV`/`…XLSX` export buttons** — doubles an already-busy button row. Rejected for the toggle.
- **Replacing CSV with XLSX** — CSV stays everywhere; XLSX is additive.
- **A-Z + admin LERG now** — deferred (frozen surface / single-operator CSV).

## Consequences

- New shared module (`utils/tabular-io.ts` or a composable) + an xlsx-parse web worker; the new deps imported only there.
- Upload inputs accept `.csv,.xlsx` (+ xlsx MIME) and drag-drop validation widens; empty-first-sheet → actionable drop-zone error.
- Per-surface **source-format tracking** (`'csv'|'xlsx'` per uploaded file/provider) feeding a computed default-export-format; the generated deck derives from providers; handed-off decks default CSV.
- Export clusters gain a `CSV | XLSX` toggle; tabular exporters route through `writeTabularFile`; PDFs untouched.
- Install-gate handling at implementation time (pin ≥14-day-old versions or scoped bypass + `--ignore-scripts`).
- **Reversal** is mechanical for A-Z/LERG (add the same calls); the tabular-IO layer is additive — removing xlsx leaves CSV via the same module.

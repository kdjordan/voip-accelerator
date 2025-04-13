# Refine A-Z Functionality & Comparison Logic

## Summary of Accomplishments (AZ Dexie Refactor - Phases 1 & 2)

- **DexieDB Foundation:** Successfully refactored A-Z file processing to use DexieDB for storing rate deck data (`az_rate_deck_db`) and detailed comparison results (`az_pricing_comparison_db`).
- **Dynamic Schemas:** Resolved the critical issue in `useDexieDB.ts` where schemas were hardcoded. The composable now correctly applies dynamic schemas based on the `dbName`.
- **Worker Consolidation:** Combined AZ report generation into a single worker (`az-comparison.worker.ts`) called by `AZService::makeAzCombinedReport`.
- **Store Refactoring:** Cleaned up `az-store.ts` to remove legacy in-memory storage and align state management with the DexieDB-first approach.
- **Sample Data Loading:** Successfully debugged and fixed the AZ sample data loading process in `load-sample-data.ts`.
- **✅ Manual Uploads Fixed:** Resolved issues preventing manual AZ file uploads and re-uploads after removal. Key fixes included:
  - Adding the missing `calculateFileStats` call after `processFile` in `AZFileUploads.vue::handleModalConfirm`.
  - Changing `azService::removeTable` to use `table.clear()` instead of `deleteStore()` to avoid Dexie connection instability.
  - Implementing checks in `removeTable` to prevent unnecessary initialization of the comparison DB during removal.
  - Enhancing `useDexieDB::getDB` to attempt reopening closed connections.

---

## Current Status

- **✅ AZ File Upload:** Both sample data loading and manual user uploads (including removal and re-upload) for AZ rate decks (`az_rate_deck_db`) are now working reliably.
- **⚙️ Comparison Logic:** The basic structure for generating and storing AZ comparisons (`az_pricing_comparison_db`) is in place but needs review and refinement.

---

## Next Phase Goal

1.  **Refine Comparison Logic:** Review and potentially refactor the AZ comparison generation, storage, and display (`az_pricing_comparison_db`, worker, service, UI) to ensure robustness and align with established US patterns where beneficial.
2.  **Verify Worker & Finalize Cleanup:** Confirm the AZ comparison worker runs correctly and complete any remaining cleanup tasks (e.g., finalizing the `removeTable` comparison deletion strategy).

---

## Action Items & Checklist (Phase 3)

### 1. Worker Verification

- [ ] **Confirm Worker Instantiation & Execution:** Test the "Generate Reports" button (which triggers `AZService::makeAzCombinedReport`).
  - Does the worker (`az-comparison.worker.ts`) run without errors (e.g., the previous `ReferenceError`)?
  - Does it successfully receive data, perform the comparison, and post back results (`pricingReport`, `codeReport`, `detailedComparisonData`)?
  - Check browser console for worker logs and any errors during report generation.

### 2. Comparison Logic Review & Refinement

- [ ] **Review `AZService::makeAzCombinedReport`:**
  - _**(Prompt):** Does the current logic (load data -> run worker -> store summaries -> store detailed data -> update store) seem robust and handle potential errors well (e.g., worker failure, DexieDB errors storing comparison)?_
  - _**(Prompt):** How does this compare to `us.service.ts::processComparisons`? Should we adopt any patterns from the US service for AZ (e.g., how it manages comparison table names, sequential processing steps, error handling)?_
- [ ] **Review `az-comparison.worker.ts`:**
  - _**(Prompt):** Is the core comparison logic efficient and accurate? Does it correctly handle edge cases like codes present in one file but not the other, or identical rates?_
- [ ] **Review `az_pricing_comparison_db` & `AZDetailedComparisonEntry`:**
  - _**(Prompt):** Is the current schema (`dialCode`, `rate1`, `rate2`, `diff`, `destName1`, `destName2`) sufficient for display and potential future analysis? Does the US comparison (`us_pricing_comparison_db`) store detailed results similarly? Should the AZ schema align more closely if the US pattern is more mature or flexible?_
- [ ] **Review Report UI (`AZPricingReport.vue`, `AZCodeReport.vue`):**
  - _**(Prompt):** How should these components handle loading states while fetching detailed data (`AZService::getDetailedComparisonData`)? How should errors be displayed? Is the current display of detailed comparison data clear and user-friendly?_

### 3. Finalize Cleanup

- [ ] **Implement `AZService::removeTable` Comparison Deletion:**
  - Finalize the logic within the `if (dbExists)` block in `azService::removeTable(tableName)` to identify and delete the corresponding comparison table(s) from `az_pricing_comparison_db`.
  - _**(Prompt - Decision Needed):** When `azfile1` (table name) is removed, how should we determine the comparison table name(s) (e.g., `azfile1_vs_azfile2`, `azfile2_vs_azfile1`) to delete?_
    - _Option A: Check `azStore.filesUploaded` to find the other potential filename (`azfile2`) and construct both possible comparison table names (`azfile1_vs_azfile2`, `azfile2_vs_azfile1`) to attempt deletion._
    - _Option B: Store the generated `detailedComparisonTableName` (e.g., `azfile1_vs_azfile2`) directly in the `azStore` when reports are generated, and use that stored name during removal (requires ensuring store is updated *before* removeTable might be called)._
    - _Option C: Query `az_pricing_comparison_db` for any table names containing `tableName` (e.g., using `startsWith` or `includes`)? (Might be less precise)._
    - _Which approach seems best? (Leaning towards A or B for precision)._

---

## AI Context & Debugging Log (AZ Dexie Refactor - End of Phase 2)

- **Focus:** Debugging manual uploads, refining comparison logic.
- **Resolution:** Manual AZ uploads/re-uploads fixed by adding missing `calculateFileStats` call and changing `removeTable` to `clear()` data instead of `deleteStore()`, avoiding DB connection instability. Comparison DB is no longer incorrectly created on removal.
- **Next:** Verify worker execution, refine comparison logic/storage/UI based on prompts, finalize comparison table deletion strategy.

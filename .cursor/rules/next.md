# Refactor A-Z CSV Upload Functionality (DexieDB Alignment)

## Goal

Refactor the A-Z (AZ) CSV file upload, processing, and reporting functionality to use a DexieDB-first architecture, strictly aligning with the **current, stable patterns** established for US CSV processing (`us.service.ts`, `useDexieDB.ts`). This involves:

1.  Storing AZ rate deck data in filename-based tables within `az_rate_deck_db`.
2.  Storing detailed comparison results in derived filename-based tables within `az_pricing_comparison_db`.
3.  Refactoring `AZService.ts` and `az-store.ts` to exclusively use DexieDB via the **existing `useDexieDB.ts` composable without modification**.
4.  Ensuring correct cleanup of both rate deck and comparison tables when files are removed or reset.
5.  Updating UI components to reflect the DexieDB data flow.

**Constraint:** Do **not** modify `client/src/composables/useDexieDB.ts`. All AZ service logic must work within the capabilities of the current composable implementation.

---

## Checklist (Reset)

### 1. DexieDB Storage (`az_rate_deck_db` & `az_pricing_comparison_db`) Strategy

- [ ] **Filename-Based Tables:** Ensure all AZ data persistence relies on table names derived directly from the uploaded CSV filename (e.g., `aztest1` for `aztest1.csv` in `az_rate_deck_db`, and `aztest1_vs_aztest2` in `az_pricing_comparison_db`).
- [ ] **`AZService::processFile`:** Modify to use the _existing_ `useDexieDB::storeInDexieDB` to save valid `AZStandardizedData` into the filename-based table in `az_rate_deck_db`.
  - _(Prompt: Confirm that the current `useDexieDB::addStore` logic within `storeInDexieDB` is sufficient for dynamically creating these AZ filename-based tables without requiring schema pre-definition or causing issues.)_
  //// check this against the working pattern in us-store. We did have this working at some point, but with all the refactoring, we need to verify this 
- [ ] **`AZService::getData`:** Modify to use the _existing_ `useDexieDB::loadFromDexieDB` to load data from the correct filename-based table in `az_rate_deck_db`.
- [ ] **`AZService::removeTable`:**
  - [ ] Modify to use the _existing_ `useDexieDB` methods (e.g., `getDB`, `deleteStore` if accessible, or alternative if needed within constraints) to delete the correct filename-based table from `az_rate_deck_db`.
  - [ ] **Add logic** to also identify and delete the corresponding comparison table(s) from `az_pricing_comparison_db` when a source AZ rate deck table is removed.
    - _(Prompt: How should `removeTable` determine the name of the comparison table(s) to delete? E.g., If 'azfile1' is removed, does it need to check if 'azfile2' exists in the store to form 'azfile1_vs_azfile2' and/or 'azfile2_vs_azfile1' for deletion?)_
- [ ] **`AZService::clearData`:**
  - [ ] Modify to iterate through all AZ-related tables in `az_rate_deck_db` and delete them using _existing_ `useDexieDB` capabilities.
  - [ ] **Add logic** to also clear **all** tables within `az_pricing_comparison_db`.
- [ ] **`AZService::getRecordCount`:** Modify to operate on filename-based tables in `az_rate_deck_db` using _existing_ `useDexieDB` capabilities.
- [ ] **`AZService::listTables`:** Modify to list filename-based tables in `az_rate_deck_db` using _existing_ `useDexieDB` capabilities.

### 2. Store (`az-store.ts`) Refactoring

- [ ] **Remove In-Memory Storage:** Eliminate the `inMemoryData` state property and related getters/actions (`getInMemoryData`, `storeInMemoryData`, etc.). _(Confirm these were fully removed in previous attempts)_.
//// No these were not becuase we had to reset the git branch after we wrecked the useDexieDB functionality for US files
- [ ] **Verify State Keys:** Ensure `filesUploaded` map uses `az1`/`az2` as keys mapping to filenames (without `.csv`). Ensure `fileStats` map uses `az1`/`az2` as keys.
- [ ] **Update `resetFiles` Action:** Ensure it clears `filesUploaded`, `fileStats`, `pricingReport`, `codeReport`, `detailedComparisonTableName` (see section 5), `invalidRows`, etc., and calls the updated `azService.clearData()` (which now clears both AZ DBs).
- [ ] **Update `removeFile` Action:** Ensure it correctly identifies the filename (without `.csv`), calls the updated `azService.removeTable` with the filename-based table name (handling deletion in both DBs), clears the corresponding `fileStats`, removes the file from `filesUploaded` and `invalidRows`, and clears the `detailedComparisonTableName` and reports.
- [ ] **Review Getters:** Ensure getters like `isFull`, `getFileNames`, `getCodeReport`, `getPricingReport`, `getDetailedComparisonTableName`, `getFileStats` function correctly with the Dexie-only flow.

### 3. Processing & Single-File Stats

- [ ] **`AZService::processFile` - Validation:** Confirm it correctly handles CSV parsing, row validation (destName, dialCode, rate), and storage of invalid rows (`store.addInvalidRow`).
- [ ] **`AZService::processFile` - Component ID:** Ensure it reliably determines the component ID (`az1` or `az2`) and calls `calculateFileStats` with the correct ID and filename (without `.csv`).
- [ ] **`AZService::calculateFileStats` - Data Loading:** Confirm it uses the updated `AZService::getData` (which uses `loadFromDexieDB`) to load data from the correct filename-based Dexie table in `az_rate_deck_db`.
- [ ] **`AZService::calculateFileStats` - Calculation:** Confirm it calculates `totalCodes`, `totalDestinations` (unique `destName`), and `uniqueDestinationsPercentage`.
- [ ] **`AZService::calculateFileStats` - Store Update:** Ensure it updates `azStore.fileStats` using the component ID (`az1` or `az2`) as the key.
- [ ] **`AzCodeSummary.vue`:** Ensure it correctly reads `fileStats` from the store using its `componentId` prop.

### 4. Two-File Report Generation Refinement

- [ ] **Consolidate Workers:** Modify `az-comparison.worker.ts` to generate and return _both_ the `AzPricingReport` (summary) and the `AzCodeReport` (summary), **and** the detailed comparison data (see section 5).
- [ ] **Remove Worker:** Delete `az-code-report.worker.ts`.
- [ ] **Create `AZService::makeAzCombinedReport`:**
  - [ ] Accepts `fileName1` and `fileName2` (without `.csv`).
  - [ ] Loads data for both files from their respective Dexie tables using the updated `AZService::getData`.
  - [ ] Instantiates and runs the consolidated `az-comparison.worker.ts`, passing the loaded data.
  - [ ] Receives the combined `{ pricingReport: AzPricingReport, codeReport: AzCodeReport, detailedComparisonData: AZDetailedComparisonEntry[] }` object from the worker.
  - [ ] Calls `azStore.setReports(pricingReport, codeReport)` to update the store state for summary reports.
  - [ ] Handles storage of `detailedComparisonData` (see section 5).
- [ ] **Refactor `handleReportsAction` (`AZFileUploads.vue`):** Simplify this function to only call `azService.makeAzCombinedReport()` when two files are ready.

### 5. Persistent Detailed Comparison (`az_pricing_comparison_db`)

- [ ] **Define DB Name:** Add `AZ_PRICING_COMPARISON: 'az_pricing_comparison_db'` to `DBName` in `app-types.ts`. _(Verify this exists)_ //// No we need to add this
- [ ] **Define Table Structure:** Define an interface `AZDetailedComparisonEntry` in a relevant types file (e.g., `az-types.ts`) containing fields: `dialCode`, `rate1`, `rate2`, `diff`, `destName1`, `destName2`.
- [ ] **Update Worker (`az-comparison.worker.ts`):**
  - [ ] Modify the worker to calculate and structure the detailed comparison data matching `AZDetailedComparisonEntry`.
  - [ ] Return the `detailedComparisonData: AZDetailedComparisonEntry[]` array alongside the summary reports.
- [ ] **Update `AZService::makeAzCombinedReport`:**
  - [ ] Receive `detailedComparisonData` from the worker.
  - [ ] Create a derived table name (e.g., `${fileName1}_vs_${fileName2}`).
  - [ ] **Store Data:** Use the _existing_ `useDexieDB::storeInDexieDB` to save the `detailedComparisonData` into a new table within `az_pricing_comparison_db` using the derived name. Ensure `replaceExisting: true` is potentially used if re-running reports should overwrite.
  - [ ] **Update Store:** Add the derived table name to the store via `azStore.setDetailedComparisonTableName(derivedTableName)`.
- [ ] **Add Store State:** Add state (`detailedComparisonTableName`, potentially `isLoadingDetailedComparison`) and corresponding actions/getters to `az-store.ts`.
- [ ] **Add `AZService::getDetailedComparisonData`:** Create a function that accepts the `detailedComparisonTableName` and uses the _existing_ `useDexieDB::loadFromDexieDB` to load data from the specified table within `az_pricing_comparison_db`.
- [ ] **Update `AZPricingReport.vue`:** Modify this component (or create a new one) to:
  - [ ] Check for `store.detailedComparisonTableName`.
  - [ ] If present, call `azService.getDetailedComparisonData(store.detailedComparisonTableName)` to load the detailed data.
  - [ ] Display the detailed, scrollable, filterable comparison data (`dialCode`, `rate1`, `rate2`, `diff`, etc.).

### 6. UI (`*.vue`) Updates

- [ ] **`AzView.vue`:** Verify conditional rendering logic for report components based on `azStore.activeReportType`, `azStore.reportsGenerated`, `azStore.detailedComparisonTableName`, and `azStore.fileStats.size`.
- [ ] **`AZContentHeader.vue`:** Verify logic for displaying journey messages and available report tabs based on store state (`filesUploaded.size`, `reportsGenerated`, `detailedComparisonTableName`). Ensure `handleReset` correctly calls `azStore.resetFiles`.
- [ ] **`AZFileUploads.vue`:**
  - [ ] Confirm `handleReportsAction` calls the updated `azService.makeAzCombinedReport` (Step 4).
  - [ ] Ensure `handleRemoveFile` calls the updated `azStore.removeFile` action (Step 2).
  - [ ] Ensure `AzCodeSummary` components are correctly bound using `componentId`.
  - [ ] Verify `handleModalConfirm` calls the updated `azService.processFile` (Step 1/3).
- [ ] **`AZCodeReport.vue`:**
  - [ ] Verify it displays individual file stats from `azStore.fileStats` when only one file is uploaded or before reports are generated.
  - [ ] Update to display comparison summary stats (`matchedCodes`, etc.) from `azStore.codeReport` _only_ when `azStore.codeReport` is available.
  - [ ] Continue showing invalid rows based on `azStore.invalidRows`.
- [ ] **`AZPricingReport.vue`:** Implement changes from Step 5 to show detailed comparison data when `detailedComparisonTableName` is available.

### 7. Sample Data (`load-sample-data.ts`)

- [ ] **Update AZ Section:** Update the AZ section within `loadSampleDecks`:
  - [ ] Call the updated `azService.clearData()` at the beginning.
  - [ ] For each sample AZ file, call the updated `azService.processFile`.
  - [ ] Remove any explicit analysis/report generation calls; processing handles single-file stats, and comparison happens via user interaction/`makeAzCombinedReport`.

---

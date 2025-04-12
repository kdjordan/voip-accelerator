# Refactor A-Z CSV Upload Functionality

## 1. Goal

Refactor the A-Z (AZ) CSV file upload, processing, and reporting functionality to align with the robust, DexieDB-first architecture implemented for the US CSV uploads. This involves ensuring consistent data storage, streamlining report generation, cleaning up the store, and updating UI components accordingly.

## 2. Storage Strategy (DexieDB)

- **Table Naming:** Transition from the current fixed table name (`az_codes`) to **filename-based table names** within the `az_rate_deck_db` Dexie database. This mirrors the US implementation and prevents data conflicts if the same file is processed multiple times.
  - **Clarification Needed:** Please confirm using filename (e.g., `aztest1`) as the Dexie table name is the desired approach.
- **Remove In-Memory Storage:** Eliminate the `inMemoryData` state property and all associated getters (`getInMemoryData`, `getInMemoryTables`, `getInMemoryDataCount`) and actions (`storeInMemoryData`, `removeInMemoryData`, `clearAllInMemoryData`) from `az-store.ts`.
- **Update `AZService`:**
  - Modify `AZService::processFile` to store data in Dexie using the filename-based table name.
  - Modify `AZService::getData` to load data from the correct filename-based table.
  - Modify `AZService::removeTable` to delete the correct filename-based table from Dexie.
  - Modify `AZService::clearData` to iterate and delete all tables within the `az_rate_deck_db` database instead of just deleting the whole DB (more resilient).
  - Modify `AZService::getRecordCount` and `listTables` to operate on the filename-based tables.

## 3. Processing & Report Flow Refinement

- **`AZService::processFile`:**
  - Confirm it correctly handles CSV parsing, row validation (destName, dialCode, rate), and storage of invalid rows (`store.addInvalidRow`).
  - Ensure it stores valid `AZStandardizedData` into the **filename-based Dexie table**.
  - Ensure it reliably determines the component ID (`az1` or `az2`) and calls `calculateFileStats` with the correct ID and filename.
- **`AZService::calculateFileStats`:**
  - Confirm it loads data from the correct filename-based Dexie table.
  - Confirm it calculates `totalCodes`, `totalDestinations` (unique `destName`), and `uniqueDestinationsPercentage`.
  - Ensure it updates `azStore.fileStats` using the component ID (`az1` or `az2`) as the key.
- **Refactor Two-File Report Generation:**
  - **Combine Workers:** The current implementation uses two separate workers (`az-comparison.worker.ts` and `az-code-report.worker.ts`). Since the comparison worker (`az-comparison.worker.ts`) already calculates most stats needed for the `AzPricingReport`, consolidate the logic. Modify `az-comparison.worker.ts` to generate and return _both_ the `AzPricingReport` and the `AzCodeReport`.
  - **Remove `az-code-report.worker.ts`**.
  - **Create `AZService::makeAzCombinedReport`:**
    - Accepts `fileName1` and `fileName2`.
    - Loads data for both files from their respective Dexie tables using `AZService::getData`.
    - Instantiates and runs the consolidated `az-comparison.worker.ts`.
    - Receives the combined `{ pricingReport: AzPricingReport, codeReport: AzCodeReport }` object from the worker.
    - Calls `azStore.setReports(pricingReport, codeReport)` to update the store state.
  - **Refactor `handleReportsAction` (`AZFileUploads.vue`):** Simplify this function to only call `azService.makeAzCombinedReport()` when two files are ready.
- **Clarify Single-File Display:**
  - The primary display for a single uploaded file will be handled by `AzCodeSummary.vue` reading from `azStore.fileStats` (keyed by `az1` or `az2`).
  - The main `AZCodeReport.vue` component should be updated to primarily display the comparison details (`matchedCodes`, `nonMatchedCodes`, etc.) from `azStore.codeReport` _only when it's populated_ (i.e., after two files have been processed via `makeAzCombinedReport`). It can still show the individual file stats from the `codeReport.file1` and `codeReport.file2` objects when available.
- **Persistent Detailed Comparison:**
  - **Clarification Needed:** The current `az-comparison.worker.ts` consolidates results immediately. Unlike the US flow which stores detailed comparisons in `us_pricing_comparison_db`, AZ does not have a similar persistent detailed table. Is the current summary-only `AzPricingReport` sufficient, or should we implement a persistent detailed comparison table (`az_pricing_comparison_db`) similar to the US section? (Assuming the current summary report is sufficient for now).

## 4. Store (`az-store.ts`) Refactoring

- **Remove:** `inMemoryData` state and related getters/actions (as listed in section 2).
- **Verify State Keys:** Ensure `filesUploaded` map uses `az1`/`az2` as keys mapping to filenames. Ensure `fileStats` map uses `az1`/`az2` as keys.
- **Update Actions:**
  - Review `resetFiles`: Ensure it clears `filesUploaded`, `fileStats`, `pricingReport`, `codeReport`, `invalidRows`, etc., and calls `azService.clearData()`.
  - Review `removeFile`: Ensure it correctly identifies the filename and component ID, calls `azService.removeTable` with the filename-based table name, clears the corresponding `fileStats` entry, and removes the file from `filesUploaded` and `invalidRows`.
- **Review Getters:** Ensure getters like `isFull`, `getFileNames`, `getCodeReport`, `getPricingReport`, `getFileStats` function correctly with the updated state and flow.

## 5. UI (`*.vue`) Updates

- **`AzView.vue`:** Verify conditional rendering logic for report components based on `azStore.activeReportType`, `azStore.reportsGenerated`, and potentially `azStore.hasSingleFileReport` (or just `azStore.fileStats.size`). Ensure `loadSampleDecks` call is correct (see section 6).
- **`AZContentHeader.vue`:** Verify logic for displaying journey messages and available report tabs based on store state (`filesUploaded.size`, `reportsGenerated`). Ensure the `handleReset` function correctly calls `azStore.resetFiles`.
- **`AZFileUploads.vue`:**
  - Update `handleReportsAction` as described in section 3.
  - Ensure `handleRemoveFile` calls the updated store action.
  - Ensure `AzCodeSummary` components are correctly bound using `componentId="az1"` and `componentId="az2"`.
  - Verify `handleModalConfirm` calls the updated `azService.processFile`.
- **`AZCodeReport.vue`:**
  - Update to display individual file stats (`totalCodes`, `totalDestinations`, `% unique`) primarily from `azStore.codeReport.file1` / `codeReport.file2` when `azStore.codeReport` is available.
  - Display comparison stats (`matchedCodes`, etc.) only when `azStore.codeReport` is available.
  - Continue showing invalid rows based on `azStore.invalidRows`.
- **`AZPricingReport.vue`:** Verify it correctly reads and displays data from `azStore.pricingReport`. Ensure filtering/sorting logic is sound.
- **`AzCodeSummary.vue`:** Ensure it correctly reads `fileStats` from the store using its `componentId` prop (e.g., `store.fileStats.get(props.componentId)`).

## 6. Sample Data (`load-sample-data.ts`)

- Update the AZ section within `loadSampleDecks`:
  - Call `azService.clearData()` at the beginning.
  - For each sample AZ file:
    - Call `azService.processFile`.
    - (No explicit analysis call needed here, as `fileStats` covers the single-file view).

## 7. Clarifications Needed

- **Table Naming:** Confirm filename-based Dexie tables (e.g., `aztest1`) are preferred over a single fixed table (`az_codes`)? (Recommended: filename-based)
- **Detailed Comparison Storage:** Is the current summary `AzPricingReport` sufficient, or is a persistent, detailed comparison table (like US `us_pricing_comparison_db`) required for AZ? (Assuming summary is sufficient)

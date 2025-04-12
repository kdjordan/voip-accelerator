# Refactor A-Z CSV Upload Functionality

## Goal

Refactor the A-Z (AZ) CSV file upload, processing, and reporting functionality to align with the robust, DexieDB-first architecture implemented for the US CSV uploads. This involves ensuring consistent data storage, streamlining report generation, cleaning up the store, and updating UI components accordingly.

---

## Checklist

### 1. DexieDB Storage Strategy (`az_rate_deck_db`)

- [ ] **Table Naming:** Implement filename-based table names (e.g., `aztest1` for `aztest1.csv`) within the `az_rate_deck_db`.
- [ ] **Update `AZService::processFile`:** Modify to store valid `AZStandardizedData` into the **filename-based Dexie table**.
- [ ] **Update `AZService::getData`:** Modify to load data from the correct filename-based table.
- [ ] **Update `AZService::removeTable`:** Modify to delete the correct filename-based table from Dexie.
- [ ] **Update `AZService::clearData`:** Modify to iterate and delete all filename-based tables within `az_rate_deck_db`.
- [ ] **Update `AZService::getRecordCount`:** Modify to operate on filename-based tables.
- [ ] **Update `AZService::listTables`:** Modify to operate on filename-based tables.

### 2. Store (`az-store.ts`) Refactoring

- [ ] **Remove In-Memory Storage:** Eliminate the `inMemoryData` state property.
- [ ] **Remove In-Memory Getters:** Remove `getInMemoryData`, `getInMemoryTables`, `getInMemoryDataCount`.
- [ ] **Remove In-Memory Actions:** Remove `storeInMemoryData`, `removeInMemoryData`, `clearAllInMemoryData`.
- [ ] **Verify State Keys:** Ensure `filesUploaded` map uses `az1`/`az2` as keys mapping to filenames (without `.csv`). Ensure `fileStats` map uses `az1`/`az2` as keys.
- [ ] **Update `resetFiles` Action:** Ensure it clears `filesUploaded`, `fileStats`, `pricingReport`, `codeReport`, `detailedComparisonReport`, `invalidRows`, etc., and calls the updated `azService.clearData()`.
- [ ] **Update `removeFile` Action:** Ensure it correctly identifies the filename (without `.csv`), calls the updated `azService.removeTable` with the filename-based table name, clears the corresponding `fileStats` entry, removes the file from `filesUploaded` and `invalidRows`, and potentially clears reports if applicable.
- [ ] **Review Getters:** Ensure getters like `isFull`, `getFileNames`, `getCodeReport`, `getPricingReport`, `getDetailedComparisonReport`, `getFileStats` function correctly with the updated state and flow.

### 3. Processing & Single-File Stats

- [ ] **`AZService::processFile` - Validation:** Confirm it correctly handles CSV parsing, row validation (destName, dialCode, rate), and storage of invalid rows (`store.addInvalidRow`).
- [ ] **`AZService::processFile` - Component ID:** Ensure it reliably determines the component ID (`az1` or `az2`) and calls `calculateFileStats` with the correct ID and filename (without `.csv`).
- [ ] **`AZService::calculateFileStats` - Data Loading:** Confirm it loads data from the correct filename-based Dexie table.
- [ ] **`AZService::calculateFileStats` - Calculation:** Confirm it calculates `totalCodes`, `totalDestinations` (unique `destName`), and `uniqueDestinationsPercentage`.
- [ ] **`AZService::calculateFileStats` - Store Update:** Ensure it updates `azStore.fileStats` using the component ID (`az1` or `az2`) as the key.
- [ ] **`AzCodeSummary.vue`:** Ensure it correctly reads `fileStats` from the store using its `componentId` prop (e.g., `store.fileStats.get(props.componentId)`).

### 4. Two-File Report Generation Refinement

- [ ] **Consolidate Workers:** Modify `az-comparison.worker.ts` to generate and return _both_ the `AzPricingReport` (summary) and the `AzCodeReport` (summary).
- [ ] **Remove Worker:** Delete `az-code-report.worker.ts`.
- [ ] **Create `AZService::makeAzCombinedReport`:**
  - [ ] Accepts `fileName1` and `fileName2` (without `.csv`).
  - [ ] Loads data for both files from their respective Dexie tables using `AZService::getData`.
  - [ ] Instantiates and runs the consolidated `az-comparison.worker.ts`.
  - [ ] Receives the combined `{ pricingReport: AzPricingReport, codeReport: AzCodeReport }` object from the worker.
  - [ ] Calls `azStore.setReports(pricingReport, codeReport)` to update the store state.
- [ ] **Refactor `handleReportsAction` (`AZFileUploads.vue`):** Simplify this function to only call `azService.makeAzCombinedReport()` when two files are ready.

### 5. Persistent Detailed Comparison (`az_pricing_comparison_db`)

- [ ] **Define DB Name:** Add `AZ_PRICING_COMPARISON: 'az_pricing_comparison_db'` to `DBName` in `app-types.ts`.
- [ ] **Define Table Structure:** Define an interface (e.g., `AZDetailedComparisonEntry`) for the data to be stored in each comparison table (likely including `dialCode`, `rate1`, `rate2`, `diff`, `destName1`, `destName2`, etc.). The table name within this DB should be derived from the two source filenames (e.g., `azfile1_vs_azfile2`).
- [ ] **Update Worker (`az-comparison.worker.ts`):**
  - [ ] Modify the worker to calculate and structure the detailed comparison data matching `AZDetailedComparisonEntry`.
  - [ ] Return the detailed comparison data array alongside the summary reports: `{ pricingReport: AzPricingReport, codeReport: AzCodeReport, detailedComparisonData: AZDetailedComparisonEntry[] }`.
- [ ] **Update `AZService::makeAzCombinedReport`:**
  - [ ] Receive `detailedComparisonData` from the worker.
  - [ ] Create a derived table name (e.g., `${fileName1}_vs_${fileName2}`).
  - [ ] Implement logic to **store** the `detailedComparisonData` into a new table within `az_pricing_comparison_db` using the derived name. Use a Dexie utility or modify `useDexieDB` if necessary.
  - [ ] Add the derived table name to the store (e.g., `azStore.setDetailedComparisonTableName(derivedTableName)`).
- [ ] **Add Store State:** Add state (`detailedComparisonTableName`, potentially `isLoadingDetailedComparison`) and corresponding actions/getters to `az-store.ts`.
- [ ] **Add `AZService::getDetailedComparisonData`:** Create a function to load data from a specific table within `az_pricing_comparison_db` given the `detailedComparisonTableName`.
- [ ] **Update `AZService::clearData`:** Modify to also clear all tables within `az_pricing_comparison_db`.
- [ ] **Update `azStore.resetFiles`:** Ensure it clears `detailedComparisonTableName`.
- [ ] **Update `AZPricingReport.vue`:** Modify this component (or create a new one) to:
  - [ ] Load data using `azService.getDetailedComparisonData(store.detailedComparisonTableName)` when available.
  - [ ] Display the detailed, scrollable, filterable comparison data (dial code, rates, differences).

### 6. UI (`*.vue`) Updates

- [ ] **`AzView.vue`:** Verify conditional rendering logic for report components based on `azStore.activeReportType`, `azStore.reportsGenerated`, `azStore.detailedComparisonTableName`, and `azStore.fileStats.size`.
- [ ] **`AZContentHeader.vue`:** Verify logic for displaying journey messages and available report tabs based on store state (`filesUploaded.size`, `reportsGenerated`, `detailedComparisonTableName`). Ensure `handleReset` correctly calls `azStore.resetFiles`.
- [ ] **`AZFileUploads.vue`:**
  - [ ] Confirm `handleReportsAction` calls the updated service method (Step 4).
  - [ ] Ensure `handleRemoveFile` calls the updated store action (Step 2).
  - [ ] Ensure `AzCodeSummary` components are correctly bound using `componentId="az1"` and `componentId="az2"`.
  - [ ] Verify `handleModalConfirm` calls the updated `azService.processFile` (Step 1).
- [ ] **`AZCodeReport.vue`:**
  - [ ] Update to display individual file stats (`totalCodes`, etc.) primarily from `azStore.codeReport.file1` / `codeReport.file2` when `azStore.codeReport` is available.
  - [ ] Display comparison stats (`matchedCodes`, etc.) only when `azStore.codeReport` is available.
  - [ ] Continue showing invalid rows based on `azStore.invalidRows`.
- [ ] **`AZPricingReport.vue`:** Implement changes from Step 5 to show detailed comparison.

### 7. Sample Data (`load-sample-data.ts`)

- [ ] **Update AZ Section:** Update the AZ section within `loadSampleDecks`:
  - [ ] Call the updated `azService.clearData()` at the beginning.
  - [ ] For each sample AZ file, call the updated `azService.processFile`.
  - [ ] _Remove_ any explicit analysis/report generation calls for sample data; processing should handle single-file stats, and comparison happens on user interaction.

---

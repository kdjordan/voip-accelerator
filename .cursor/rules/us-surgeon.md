# US Rate Sheet Surgeon: Refactor & Implementation Plan

## Goal

Create a robust US Rate Sheet management feature, distinct from the AZ Rate Sheet view (`AZRateSheetView.vue` / `AZRateSheetTable.vue`). This involves:

1.  **Refactoring:** Renaming existing AZ components for clarity (Done).
2.  **Implementing US View:** Creating new US-specific components (Done).
3.  **Integrating DexieJS (US):** Using DexieJS for storing and managing US Rate Sheet data with US-specific logic (no discrepancies/change codes, single optional effective date). Uses `us-rate-sheet-store.ts`.
4.  **Integrating DexieJS (AZ):** DEFERRED - Refactoring the AZ Rate Sheet components to use DexieJS, maintaining its existing logic.

---

## Implementation Phases & Checklist

### Phase 1: Refactor Existing AZ Rate Sheet Components (DONE)

- [x] **Rename View:** Rename `client/src/pages/RateSheetView.vue` to `client/src/pages/AZRateSheetView.vue`.
- [x] **Rename & Move Table:** Rename `client/src/components/rate-sheet/RateSheetTable.vue` to `client/src/components/rate-sheet/az/AZRateSheetTable.vue`. Create the `az` subdirectory if it doesn't exist.
- [x] **Update Imports:** Update all imports referencing the old component names/paths (e.g., in router, `AZRateSheetView.vue`).
- [x] **Verify AZ Functionality:** Briefly test the AZ Rate Sheet feature to ensure the renaming didn't break anything (it still functions using Pinia/localStorage).

### Phase 2: Create US Rate Sheet Component Foundation (DONE)

- [x] **Create US View:** Create `client/src/pages/USRateSheetView.vue` by copying and adapting the refactored `AZRateSheetView.vue`.
- [x] **Create US Table:** Create `client/src/components/rate-sheet/us/USRateSheetTable.vue` by copying and adapting the refactored `AZRateSheetTable.vue`. Create the `us` subdirectory.
- [x] **Update US View:** Modify `USRateSheetView.vue` to import and use `USRateSheetTable.vue`.
- [x] **Add Routing:** Add a new route for `/us-rate-sheet` (or similar) pointing to `USRateSheetView.vue`.
- [x] **Update Navigation:** Add a link in the UI (e.g., sidebar) to navigate to the new US Rate Sheet page.

### Phase 3: Implement US Rate Sheet Logic (DexieJS Integration)

- [x] **Define US `USRateSheetEntry` Interface:** Defined in `us-types.ts`.
- [x] **Define US DexieJS Storage:** Added `DBName.US_RATE_SHEET` and schema. Using fixed table `'entries'`.
- [x] **Define US Column Mappings:** Uses `US_COLUMN_ROLE_OPTIONS`.
- [x] **Adapt Upload/Processing (`USRateSheetView.vue`):**
  - [x] Use `PreviewModal` with `US_COLUMN_ROLE_OPTIONS`.
  - [x] Pass `:source="'US'"` to `PreviewModal`.
  - [x] **Modify `handleModalConfirm` Logic:**
    - [x] Confirmed it calls the service correctly.
    - [x] `effectiveDate` is optional.
    - [x] Correctly interpret `undefined` `indeterminateDefinition` as `'column'`.
    - [x] Keep `store.clearUsRateSheetData()` in `catch` block.
  - [x] Refactored to use `useDragDrop` composable.
  - [x] Corrected `Papa.parse` logic for modal preview.
  - [x] Added/refined logging.
  - [x] **Add Upload Animation:** Implemented upload animation matching AZ Rate Sheet.
  - [ ] **Implement Invalid Rows Display:** Add UI (collapsible section) similar to `AZRateSheetView.vue` to show invalid rows from the store.
  - [ ] **Implement Total Records Display:** Add UI element to display the reactive total records count from the store.
- [x] **Create/Adapt Service (`usRateSheetService`):**
  - [x] `processFile` method handles parsing, validation, standardization.
  - [x] Uses `DBName.US_RATE_SHEET` and table name `'entries'`.
  - [x] Added 7-digit NPANXX / 4-digit NPA handling.
  - [x] `getData`, `getTableCount`, `clearData` methods added and corrected.
  - [x] `processFile` handles optional `effectiveDate` and ensures table exists before parsing.
  - [x] **Performance Optimizations:**
    - [x] Implemented batch processing for large datasets (250K+ rows).
    - [x] Added progress indicators during processing.
    - [x] Optimized memory usage by processing one row at a time.
    - [x] Refined error handling to ensure processing continues even if some rows fail.
    - [x] Fixed schema upgrade race conditions by ensuring store creation happens once.
  - [x] **Modify `processFile` return value:** Return `{ recordCount: number; invalidRows: InvalidUsRow[] }`.
  - [ ] **Add Paginated Fetching (Alternative):** Current implementation uses local filtering + infinite scroll. Consider service-level pagination if performance degrades with extremely large datasets.
- [x] **Create & Update `us-rate-sheet-store.ts`:**
  - [x] Created store.
  - [x] Added state: `hasUsRateSheetData`, `usRateSheetEffectiveDate`, `isLoading`, `error`.
  - [x] Refactored Actions/Getters to call service methods.
  - [x] `handleUploadSuccess` stores effective date.
  - [ ] **Add State:** Add `totalRecordsProcessed: number | null` and `invalidRows: InvalidUsRow[]`.
  - [ ] **Update `handleUploadSuccess`:** Store `totalRecordsProcessed` and `invalidRows` returned from the service.
  - [ ] **Add Getters:** Add `getTotalRecordsProcessed`, `getInvalidRows`, `hasInvalidRows`.
  - [ ] **Add Actions/State for Pagination:** Add state/actions to manage current page/offset and trigger paginated data fetches from the service for `USRateSheetTable.vue` (if switching from local filtering).
- [x] **Integrate `us-rate-sheet-store.ts` into `USRateSheetView.vue`:**
  - [x] Import and use store.
  - [x] Call `store.loadRateSheetData()` (or initial check) in `onMounted`.
  - [x] Updated `handleModalConfirm` to call `store.handleUploadSuccess`.
  - [x] Updated `handleClearData` to call `store.clearUsRateSheetData`.
  - [x] Use store state/getters for UI (loading, error, has data).
  - [x] **Layout Adjustments:** Constrained table width and added top margin.
  - [ ] **Connect UI:** Bind display elements for total records and invalid rows to store getters.
- [x] **Adapt Table Logic (`USRateSheetTable.vue` - DexieJS Focus):**
  - [x] **Data Fetching:** Fetch initial data from service (`getData`).
  - [x] **Implement Infinite Scrolling:** Use `useInfiniteScroll` (VueUse) with local filtering.
  - [x] **Filtering/Searching:** Implemented basic text search on NPANXX.
  - [x] **Display Data:** Displays `USRateSheetEntry` data (NPANXX, Inter, Intra, IJ rates).
  - [x] **Remove Discrepancy/Conflict UI:** Removed AZ-specific UI and logic.
  - [x] **Export Data:** Modified `handleExport` to export all currently loaded/filtered data.
  - [x] **Clear Data Interaction:** Button calls service/store clear methods.
  - [x] **Styling:** Applied consistent styling based on `USDetailedComparisonTable`.
  - [ ] **Advanced Filtering:** Implement more advanced filtering/sorting if needed (e.g., by rate value, state if LERG data is integrated).

### Phase 4: Refactor AZ Rate Sheet Storage (DexieJS Integration) - DEFERRED

- [x] **Rename Store:** Renamed `rate-sheet-store.ts` to `az-rate-sheet-store.ts`. Updated ID to `azRateSheet` and function to `useAzRateSheetStore`.
- [x] **Define AZ DexieJS Storage:**
  - Renamed `DBName.RATE_SHEET` to `DBName.AZ_RATE_SHEET` ('az_rate_sheet_db') in `app-types.ts`.
  - Updated schema for `az_rate_sheet_db` in `DBSchemas` (`app-types.ts`) based on `AZRateSheetEntry` (includes `effectiveDate`, potential conflict fields).
- [ ] **Update AZ Store Imports/Usages:** Search codebase and update imports/usages of the renamed store.
- [ ] **Define AZ `AZRateSheetEntry` Interface:**
  - Confirm `AZRateSheetEntry` in `client/src/types/domains/rate-sheet-types.ts` has necessary fields (id, name, prefix, rate, effectiveDate, changeCode, conflict, etc.).
- [ ] **Adapt Upload/Processing (`AZRateSheetView.vue`):**
  - Modify the service (`azRateSheetService`) to:
    - Standardize data into `AZRateSheetEntry` objects.
    - Store standardized data in the `az_rate_sheet` DexieJS table within `az_rate_sheet_db`.
- [ ] **Refactor `az-rate-sheet-store.ts`:**
  - Remove localStorage logic (`saveToLocalStorage`, `loadFromLocalStorage`, etc.).
  - Remove state variables holding the full dataset (`originalData`, `groupedData`).
  - Keep/adapt state for metadata (e.g., `hasStoredData`, `tableName='entries'` (or similar), `discrepancyCount`, `optionalFields`, invalid row info if needed for display).
  - Modify actions/getters to interact with DexieJS via the service (e.g., fetch `discrepancyCount` via query, check table existence).
- [ ] **Adapt Table Logic (`AZRateSheetTable.vue` - DexieJS Focus):**
  - **Refactor ALL data operations to use DexieJS:**
    - Data Fetching (including grouping by destination). _(Service layer needed)_. Needs to fetch from `az_rate_sheet_db`.
    - Filtering/Searching (Dexie queries via service).
    - **Conflict Resolution:** Retain `handleBulkUpdate`, `saveRateSelection` logic but adapt to perform DexieJS updates against the table (via service).
    - **Effective Date Setting (Per-Row):** Retain UI. Adapt `applyEffectiveDateSettings` to use the `effective-date-updater.worker.ts`, ensuring the worker interacts with the DexieJS table (via service).
    - Export Data (query DexieJS via service).
    - Clear Data (delete DexieJS table via service, reset store state).

---

## ✅ Resolved Questions

1.  **Effective Date Requirement:** **Optional** for US Rate Sheets.
2.  **Total Records Display:** Count comes from service (`processFile` return) -> store (`totalRecordsProcessed`) -> displayed reactively in `USRateSheetView.vue`.
3.  **Invalid Rows Display:** Yes, implement UI in `USRateSheetView.vue` similar to AZ view, populated from service -> store (`invalidRows`).
4.  **Data Clearing Logic:** Keep current logic (clear on error in `handleModalConfirm`). Use `table.clear()` or DB delete/recreate in service.
5.  **Table Component (`USRateSheetTable.vue`):** Fetch from Dexie via service. Implement infinite scrolling with local filtering. Display correct US data.

---

## ❓ Open Questions & Prompts (Deferred)

- **AZ Schema:** (DEFERRED) Confirm the `AZRateSheetEntry` type and the schema defined for `DBName.AZ_RATE_SHEET` in `DBSchemas` are fully aligned.

---

## 📝 Current Status & Next Steps (Updated [Current Date])

**Status:**

- The core functionality for uploading, processing, storing (via DexieJS), and displaying US Rate Sheet data is implemented.
- Large file uploads are now stable due to fixes in schema handling and batch processing within the service.
- The `USRateSheetTable` component correctly displays the US data structure with infinite scrolling and basic search.
- UI styling and layout for the US Rate Sheet view and table are consistent with other app sections.

**Remaining Tasks (Phase 3):**

- **Store Enhancement:** Update `us-rate-sheet-store.ts` to store and expose `totalRecordsProcessed` and `invalidRows` returned from the `usRateSheetService.processFile` method. Add corresponding getters (`getTotalRecords`, `getInvalidRows`, `hasInvalidRows`).
- **UI Updates (`USRateSheetView.vue`):**
  - Display the total processed record count using the new store getter.
  - Implement the UI (e.g., a collapsible section) to display invalid rows using the new store getter.
- **Table Filtering (`USRateSheetTable.vue`):** Add more filtering/sorting options beyond the current NPANXX search if required (e.g., filter by rate range).

**Next Steps:**

1.  Implement the store updates (state/getters for total records, invalid rows).
2.  Connect the UI in `USRateSheetView.vue` to display the total records and invalid rows from the store.
3.  Consider adding more advanced filtering/sorting to the `USRateSheetTable.vue` if necessary.

---

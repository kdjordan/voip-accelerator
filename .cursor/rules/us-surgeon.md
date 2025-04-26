# US Rate Sheet Surgeon: Refactor & Implementation Plan

## Goal

Create a robust US Rate Sheet management feature, distinct from the AZ Rate Sheet view (`AZRateSheetView.vue` / `AZRateSheetTable.vue`). This involves:

1.  **Refactoring:** Renaming existing AZ components for clarity (Done).
2.  **Implementing US View:** Creating new US-specific components (Done).
3.  **Integrating DexieJS (US):** Using DexieJS for storing and managing US Rate Sheet data with US-specific logic (no discrepancies/change codes, single optional effective date). Uses `us-rate-sheet-store.ts`.
4.  **Integrating LERG:** Using `lergStore` to derive State information for display and filtering.
5.  **Integrating DexieJS (AZ):** DEFERRED - Refactoring the AZ Rate Sheet components to use DexieJS, maintaining its existing logic.

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
- [x] **Define US DexieJS Storage:** Added `DBName.US_RATE_SHEET` ('us_rate_sheet_db') and schema using fixed table `'entries'`.
- [x] **Update Dexie Schema (`app-types.ts`):** Added `stateCode` as an index to the `entries` table definition for `us_rate_sheet_db`.
- [x] **Define US Column Mappings:** Uses `US_COLUMN_ROLE_OPTIONS`.
- [x] \*\*Adapt Upload/Processing (`USRateSheetView.vue`):
  - [x] Use `PreviewModal` with `US_COLUMN_ROLE_OPTIONS`.
  - [x] Pass `:source="'US'"` to `PreviewModal`.
  - [x] **Modify `handleModalConfirm` Logic:**
    - [x] Confirmed it calls the service correctly.
    - [x] `effectiveDate` is optional.
    - [x] Correctly interpret `undefined` `indeterminateDefinition` as `'column'`.
    - [x] Keep `store.clearUsRateSheetData()` in `catch` block.
    - [x] Hide modal immediately on confirm.
  - [x] Refactored to use `useDragDrop` composable.
  - [x] Corrected `Papa.parse` logic for modal preview.
  - [x] Added/refined logging.
  - [x] **Add Upload Animation:** Implemented upload animation matching AZ Rate Sheet.
  - [ ] **Implement Invalid Rows Display:** Add UI (collapsible section) similar to `AZRateSheetView.vue` to show invalid rows from the store.
  - [ ] **Implement Total Records Display:** Add UI element to display the reactive total records count from the store.
- [x] \*\*Create/Adapt Service (`usRateSheetService`):
  - [x] `processFile` method handles parsing, validation, standardization.
  - [x] Uses database `'us_rate_sheet_db'` and table name `'entries'`.
  - [x] Added 7-digit NPANXX / 4-digit NPA handling.
  - [x] `getData`, `getTableCount`, `clearData` methods added and corrected.
  - [x] `processFile` handles optional `effectiveDate` and ensures table exists before parsing.
  - [x] **Integrate LERG:** Injected `lergStore`, added logic in `processRow` to look up `stateCode` using `npa` and **save it to Dexie record**. Row marked invalid if NPA not found in LERG.
  - [x] **Add LERG Guard:** Added check to `processFile` to prevent execution if `lergStore` is not loaded.
  - [x] **Performance Optimizations:**
    - [x] Implemented batch processing for large datasets.
    - [x] Added progress indicators during processing.
    - [x] Optimized memory usage by processing one row at a time.
    - [x] Refined error handling to ensure processing continues even if some rows fail.
    - [x] Fixed schema upgrade race conditions by ensuring store creation happens once.
  - [x] **Modify `processFile` return value:** Return `{ recordCount: number; invalidRows: InvalidUsRow[] }`.
- [ ] \*\*Create & Update `us-rate-sheet-store.ts`:
  - [ ] **Add State:** Add `totalRecordsProcessed: number | null` and `invalidRows: InvalidUsRow[]`.
  - [ ] **Update `handleUploadSuccess`:** Store `totalRecordsProcessed` and `invalidRows` returned from the service.
  - [ ] **Add Getters:** Add `getTotalRecordsProcessed`, `getInvalidRows`, `hasInvalidRows`.
- [x] \*\*Integrate `us-rate-sheet-store.ts` into `USRateSheetView.vue`:
  - [x] Import and use store.
  - [x] Call `store.loadRateSheetData()` (or initial check) in `onMounted`.
  - [x] Updated `handleModalConfirm` to call `store.handleUploadSuccess`.
  - [x] Updated `handleClearData` to call `store.clearUsRateSheetData`.
  - [x] Use store state/getters for UI (loading, error, has data).
  - [x] **Layout Adjustments:** Constrained table width and added top margin.
  - [ ] **Connect UI:** Bind display elements for total records and invalid rows to store getters.
- [x] \*\*Adapt Table Logic (`USRateSheetTable.vue` - DexieJS Focus):
  - [x] **Data Fetching:** Fetch initial/paginated data directly from Dexie `entries` table.
  - [x] **Implement Infinite Scrolling:** Use `useIntersectionObserver` and `loadMoreData` querying Dexie.
  - [x] **Filtering/Searching:** Implemented Dexie `where('stateCode').equals(...)` for state/province and `where('npanxx').startsWithIgnoreCase(...)` for NPANXX search.
  - [x] **Display Data:** Displays `USRateSheetEntry` data. State/Country derived via LERG lookup on NPA in the template.
  - [x] **Remove Discrepancy/Conflict UI:** Removed AZ-specific UI and logic.
  - [x] **Export Data:** Modified `handleExport` to query Dexie for filtered data.
  - [x] **Clear Data Interaction:** Button calls store clear method.
  - [x] **Styling:** Applied consistent styling.

### Phase 3.1: Add State/Province Filtering to US Rate Sheet Table (In Progress)

- [x] **Integrate LERG Data (`USRateSheetTable.vue`):**
  - [x] Import `useLergStore`.
  - [x] Ensure LERG data is available for display lookups.
- [x] \*\*Add State Filter UI (`USRateSheetTable.vue`):
  - [x] Add a `<select>` dropdown for state/province filtering.
  - [x] **Populate Dropdown:** Modified `fetchUniqueStates` to query Dexie `entries` table for distinct `stateCode` values.
  - [x] Add a `ref` (`selectedState`) to store the chosen state/province filter.
- [x] \*\*Implement State Filtering Logic (`USRateSheetTable.vue`):
  - [x] Modified `loadMoreData` to filter Dexie query directly using `where('stateCode').equals(selectedState.value)`.
  - [x] Watch `selectedState` to trigger `resetPaginationAndLoad`.
- [ ] **Current Issue:** After adding `stateCode` index to schema in `app-types.ts`, restoring LERG lookup/storage in `usRateSheetService`, and updating table logic to use `stateCode`, Dexie throws `SchemaError: KeyPath stateCode on object store entries is not indexed`. This indicates the Dexie database version was not incremented to apply the schema changes.

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
- [ ] \*\*Adapt Table Logic (`AZRateSheetTable.vue` - DexieJS Focus):
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
2.  **Total Records Display:** Count comes from service (`processFile` return) -> store (`totalRecordsProcessed`) -> displayed reactively in `USRateSheetView.vue` (Store/UI connection still pending).
3.  **Invalid Rows Display:** Yes, implement UI in `USRateSheetView.vue` similar to AZ view, populated from service -> store (`invalidRows`) (Store/UI connection still pending).
4.  **Data Clearing Logic:** Keep current logic (clear on error in `handleModalConfirm`). Use `table.clear()` or DB delete/recreate in service.
5.  **Table Component (`USRateSheetTable.vue`):** Fetch from Dexie via service. Implement infinite scrolling with Dexie filtering (now filtering by `stateCode`). Display correct US data.
6.  **State Filtering Approach:** Decided to store `stateCode` in Dexie (like `USDetailedComparisonTable.vue`) and filter directly on that index, rather than deriving NPAs at runtime.

---

## ❓ Open Questions & Prompts

1.  **Dexie Initialization:** Where is the Dexie instance for `DBName.US_RATE_SHEET` initialized and versioned? Is it within `client/src/composables/useDexieDB.ts`? (Needed to resolve the `SchemaError`)
2.  **AZ Schema:** (DEFERRED) Confirm the `AZRateSheetEntry` type and the schema defined for `DBName.AZ_RATE_SHEET` in `DBSchemas` are fully aligned.

---

## 📝 Current Status & Next Steps (Updated [Current Date])

**Status:**

- Switched strategy to align `USRateSheetTable.vue` with `USDetailedComparisonTable.vue`.
- `us-rate-sheet.service.ts` updated to look up `stateCode` via LERG and store it in Dexie.
- `app-types.ts` updated to include `stateCode` index in the schema definition for `us_rate_sheet_db`.
- `USRateSheetTable.vue` updated to fetch unique `stateCode` values directly from Dexie and filter using `where('stateCode').equals(...)`.
- **Current Issue:** Dexie `SchemaError: KeyPath stateCode on object store entries is not indexed`. The database schema version needs to be incremented for the schema changes to take effect.

**Remaining Tasks (Phase 3 & 3.1):**

- **Resolve SchemaError:**
  - Identify where the Dexie DB version for `us_rate_sheet_db` is managed.
  - Increment the version number.
- **Re-upload Data:** Clear existing data and re-upload the US Rate Sheet file to populate `stateCode` using the updated service logic.
- **Verify Functionality:** Test state/province dropdown population and filtering in `USRateSheetTable.vue`.
- **Store Enhancement:** Update `us-rate-sheet-store.ts` to store/expose `totalRecordsProcessed` & `invalidRows`.
- **UI Updates (`USRateSheetView.vue`):** Display total records & invalid rows.

**Next Steps (New Chat):**

1.  **Answer Question 1:** Where is the Dexie DB version managed?
// doesn't dexie have an internal mechanis
2.  Increment the Dexie DB version number in the appropriate file.
3.  Guide user to clear data and re-upload.
4.  Verify the fix.

---

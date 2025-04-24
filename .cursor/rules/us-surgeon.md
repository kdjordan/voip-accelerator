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
  - [ ] **Implement Invalid Rows Display:** Add UI (collapsible section) similar to `AZRateSheetView.vue` to show invalid rows from the store.
  - [ ] **Implement Total Records Display:** Add UI element to display the reactive total records count from the store.
- [ ] **Create/Adapt Service (`usRateSheetService`):**
  - [x] `processFile` method handles parsing, validation, standardization.
  - [x] Uses `DBName.US_RATE_SHEET` and table name `'entries'`.
  - [x] Added 7-digit NPANXX / 4-digit NPA handling.
  - [x] `getData`, `getTableCount`, `clearData` methods added.
  - [x] `processFile` handles optional `effectiveDate`.
  - [ ] **Modify `processFile` return value:** Return `{ count: number; invalidRows: InvalidUsRow[] }`.
  - [ ] **Add Paginated Fetching:** Implement a method like `getPaginatedData(offset: number, limit: number, filters?: any)` for infinite scrolling.
- [ ] **Create & Update `us-rate-sheet-store.ts`:**
  - [x] Created store.
  - [x] Added state: `hasUsRateSheetData`, `usRateSheetEffectiveDate`, `isLoading`, `error`.
  - [x] Refactored Actions/Getters to call service methods.
  - [x] `handleUploadSuccess` stores effective date.
  - [ ] **Add State:** Add `totalRecordsProcessed: number | null` and `invalidRows: InvalidUsRow[]`.
  - [ ] **Update `handleUploadSuccess`:** Store `totalRecordsProcessed` and `invalidRows` returned from the service.
  - [ ] **Add Getters:** Add `getTotalRecordsProcessed`, `getInvalidRows`, `hasInvalidRows`.
  - [ ] **Add Actions/State for Pagination:** Add state/actions to manage current page/offset and trigger paginated data fetches from the service for `USRateSheetTable.vue`.
- [ ] **Integrate `us-rate-sheet-store.ts` into `USRateSheetView.vue`:**
  - [x] Import and use store.
  - [x] Call `store.loadRateSheetData()` (or initial check) in `onMounted`.
  - [x] Updated `handleModalConfirm` to call `store.handleUploadSuccess`.
  - [x] Updated `handleClearData` to call `store.clearUsRateSheetData`.
  - [x] Use store state/getters for UI (loading, error, has data).
  - [ ] **Connect UI:** Bind display elements for total records and invalid rows to store getters.
- [ ] **Adapt Table Logic (`USRateSheetTable.vue` - DexieJS Focus):**
  - [ ] **Data Fetching:** Fetch initial data and subsequent pages via the store/service actions for infinite scrolling.
  - [ ] **Implement Infinite Scrolling:** Use `useInfiniteScroll` (VueUse) to trigger data loading as the user scrolls.
  - [ ] **Filtering/Searching:** Implement basic state filtering (sort alphabetically asc/desc). Store filter criteria locally or in the store.
  - [ ] **Display Effective Date:** Display single effective date from store.
  - [ ] **Remove Discrepancy/Conflict UI.**
  - [ ] **Export Data:** Modify `handleExport` to get _all_ current data from DexieJS via service (consider potential performance for very large datasets).
  - [ ] **Clear Data Interaction:** Button handled in view.

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
4.  **Data Clearing Logic:** Keep current logic (clear on error in `handleModalConfirm`).
5.  **Table Component (`USRateSheetTable.vue`):** Fetch from Dexie via store/service. Filter by state (alphabetical sort). Implement infinite scrolling. Defer population filtering.

---

## ❓ Open Questions & Prompts (Deferred)

- **AZ Schema:** (DEFERRED) Confirm the `AZRateSheetEntry` type and the schema defined for `DBName.AZ_RATE_SHEET` in `DBSchemas` are fully aligned.
- **Table Component Refactor:** (RESOLVED for US - Fetch from Dexie) Decide if `AZRateSheetTable` will fetch data via the store state or directly via service calls to Dexie when its refactor is addressed.

---

## ❓ New Diagnostic Questions (Rate Sheet Dexie Initialization - 2024-07-25)

Given the persistent `InvalidTableError: Table entries does not exist` for `us_rate_sheet_db` despite schema correction, let's compare the working (`USFileUploads`/`us.service.ts`/`us_rate_deck_db`) and non-working (`USRateSheetView`/`us-rate-sheet.service.ts`/`us_rate_sheet_db`) flows:

1.  **Dexie Initialization Point:** Where is the `useDexieDB` composable first invoked or the `us_rate_sheet_db` specifically opened in the application lifecycle? Is it guaranteed to have run and successfully opened the DB _before_ `USRateSheetView.vue` mounts or its associated `USRateSheetService` is instantiated/used? How does this compare to when `us_rate_deck_db` is initialized relative to `USFileUploads.vue`?
2.  **Schema Versioning:** Have we incremented the overall Dexie database version number (likely within `useDexieDB.ts` or wherever `Dexie('VoipDb', version)` is called) since adding/correcting the `us_rate_sheet_db` schema in `DBSchemas`? Dexie requires a version bump to apply schema changes to an _existing_ database instance. If the DB was previously opened without the `entries` table definition, it won't be added without a version increment.
3.  **`useDexieDB` Implementation Review:** Can we examine the `useDexieDB.ts` composable? Does its `openDatabase` or `getDB` function contain any conditional logic, error handling, or specific checks related to database names that might inadvertently prevent `us_rate_sheet_db` from opening correctly or applying its schema?
4.  **Service Instantiation Context:** Where exactly is the `new USRateSheetService()` instance created? Is it within the `<script setup>` of `USRateSheetView.vue`? If so, could the service constructor (which calls `useDexieDB`) be executing _before_ the composable has finished the asynchronous process of opening/upgrading the `us_rate_sheet_db`?

---

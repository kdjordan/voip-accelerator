# US Rate Sheet Surgeon: Refactor & Implementation Plan

## Goal

Create a robust US Rate Sheet management feature, distinct from the AZ Rate Sheet view (`AZRateSheetView.vue` / `AZRateSheetTable.vue`). This involves:

1.  **Refactoring:** Renaming existing AZ components for clarity (Done).
2.  **Implementing US View:** Creating new US-specific components (Done).
3.  **Integrating DexieJS (US):** Using DexieJS for storing and managing US Rate Sheet data with US-specific logic (no discrepancies/change codes, single effective date). Uses `us-rate-sheet-store.ts`.
4.  **Integrating DexieJS (AZ):** Refactoring the AZ Rate Sheet components to use DexieJS, maintaining its existing logic (discrepancies, change codes, per-row effective dates). Uses `az-rate-sheet-store.ts`.

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

- [x] **Define US `USRateSheetEntry` Interface:**
  - Defined `USRateSheetEntry` in `client/src/types/domains/us-types.ts` based on required US columns (NPA/NXX/NPANXX, Interstate/Intrastate/Indeterminate Rates).
  - Included `id` (for Dexie).
  - **Excluded** `changeCode` and `conflict` fields.
- [x] **Define US DexieJS Storage:**
  - Added `DBName.US_RATE_SHEET` ('us_rate_sheet_db') to `app-types.ts`.
  - Added schema for `us_rate_sheet_db` to `DBSchemas` in `app-types.ts` (e.g., `'++id, npa, nxx, npanxx, interRate, intraRate, ijRate'`). This DB will contain one fixed table (named `entries` in the service).
  - **Note:** This deviates from the initial plan of using a table within `us_rate_deck_db` to avoid schema conflicts with dynamic tables.
- [x] **Define US Column Mappings:**
  - Uses existing `US_COLUMN_ROLE_OPTIONS` from `us-types.ts` for the `PreviewModal`.
- [x] **Adapt Upload/Processing (`USRateSheetView.vue`):**
  - [x] Ensure `PreviewModal` props use `US_COLUMN_ROLE_OPTIONS`.
  - [x] **Pass `source` prop:** Updated to pass `:source="'US_RATE_SHEET'"` to `PreviewModal`.
  - [x] **Modify `handleModalConfirm` Logic:** Updated signature to receive `indeterminateDefinition` and `effectiveDate` from `PreviewModal` emit. Confirmed it calls the service correctly.
- [x] **Create/Adapt Service (`usRateSheetService`):** Created `USRateSheetService`:
  - [x] `processFile` method handles parsing, validation, standardization, and Dexie storage (using `useDexieDB`).
  - [x] Uses `DBName.US_RATE_SHEET` and table name `'entries'` internally.
  - [x] **Added 7-digit NPANXX / 4-digit NPA handling:** Incorporated logic from `us.service.ts` to strip leading '1' before validation.
  - [x] `getData` method added to load data from Dexie.
  - [x] `clearData` method added to clear the Dexie table (with `InvalidTableError` handling).
- [x] **Create & Update `us-rate-sheet-store.ts`:**
  - [x] **Create Store:** Created `client/src/stores/us-rate-sheet-store.ts`.
  - [x] **Add State:** Added `hasUsRateSheetData: boolean`, `usRateSheetEffectiveDate: string | null`, `isLoading`, `error`.
  - [x] **Refactor Actions/Getters:** Actions `loadRateSheetData`, `handleUploadSuccess`, `clearUsRateSheetData` correctly call service methods without needing DB/table names. `handleUploadSuccess` stores effective date.
- [x] **Integrate `us-rate-sheet-store.ts` into `USRateSheetView.vue`:**
  - [x] Import and use `useUsRateSheetStore`.
  - [x] Call `store.loadRateSheetData()` in `onMounted`.
  - [x] Updated `handleModalConfirm` to call `store.handleUploadSuccess`.
  - [x] Updated `handleClearData` to call `store.clearUsRateSheetData`.
  - [x] Use store state/getters (`getHasUsRateSheetData`, `getUsRateSheetEffectiveDate`, `isLoading`, `getError`) to control UI elements.
- [ ] **Adapt Table Logic (`USRateSheetTable.vue` - DexieJS Focus):**
  - **Data Fetching:** Fetch data via the store (`us-rate-sheet-store.ts`) which should now hold the data loaded by the service/`loadRateSheetData` action. _(May need to add state/getter in store to hold loaded data if not already present)_. Alternatively, the table could use the service directly for fetching/filtering if state management isn't needed for the raw data.
  - **Filtering/Searching:** Implement filters and search logic. If using store state, filter the array. If fetching directly, use DexieJS `.where()`/`.filter()` via the service.
  - **Display Effective Date:** Display the single, file-level effective date (fetched from `us-rate-sheet-store.ts` getter).
  - **Remove Discrepancy/Conflict UI:** Remove UI/logic for rate discrepancies/conflicts.
  - **Export Data:** Modify `handleExport` to get the current data (either from store state or via a filtered DexieJS query via service) before generating the CSV.
  - **Clear Data Interaction:** Button is in `USRateSheetView.vue`, logic is handled there.

### Phase 4: Refactor AZ Rate Sheet Storage (DexieJS Integration)

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

## Open Questions & Prompts

- **AZ Schema:** Confirm the `AZRateSheetEntry` type and the schema defined for `DBName.AZ_RATE_SHEET` in `DBSchemas` are fully aligned.
- **Table Component Refactor:** Decide if `USRateSheetTable` / `AZRateSheetTable` will fetch data via the store state or directly via service calls to Dexie.

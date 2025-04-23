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

- [x] **Define US `USRateSheetEntry` Interface:** Defined in `us-types.ts`.
- [x] **Define US DexieJS Storage:** Added `DBName.US_RATE_SHEET` and schema. Using fixed table `'entries'`.
- [x] **Define US Column Mappings:** Uses `US_COLUMN_ROLE_OPTIONS`.
- [x] **Adapt Upload/Processing (`USRateSheetView.vue`):**
  - [x] Use `PreviewModal` with `US_COLUMN_ROLE_OPTIONS`.
  - [x] **Pass `source` prop:** Updated to pass `:source="'US'"` to `PreviewModal` (maintains compatibility with `USFileUploads`).
  - [x] **Modify `handleModalConfirm` Logic:**
    - Confirmed it calls the service correctly.
    - Made `effectiveDate` optional in the initial check.
    - **Added logic to correctly interpret `undefined` `indeterminateDefinition` from modal as `'column'` before passing to service.**
  - [x] Refactored to use `useDragDrop` composable.
  - [x] Corrected `Papa.parse` logic to use `preview` option for modal display.
  - [x] Added/refined logging for troubleshooting.
- [x] **Create/Adapt Service (`usRateSheetService`):**
  - [x] `processFile` method handles parsing, validation, standardization.
  - [x] Uses `DBName.US_RATE_SHEET` and table name `'entries'`.
  - [x] Added 7-digit NPANXX / 4-digit NPA handling.
  - [x] `getData`, `getTableCount`, `clearData` methods added.
  - [x] `processFile` confirmed to handle optional `effectiveDate`.
- [x] **Create & Update `us-rate-sheet-store.ts`:**
  - [x] Created store.
  - [x] Added state: `hasUsRateSheetData`, `usRateSheetEffectiveDate`, `isLoading`, `error`.
  - [x] Refactored Actions/Getters to call service methods.
  - [x] `handleUploadSuccess` stores effective date.
- [x] **Integrate `us-rate-sheet-store.ts` into `USRateSheetView.vue`:**
  - [x] Import and use store.
  - [x] Call `store.loadRateSheetData()` in `onMounted`.
  - [x] Updated `handleModalConfirm` to call `store.handleUploadSuccess`.
  - [x] Updated `handleClearData` to call `store.clearUsRateSheetData`.
  - [x] Use store state/getters for UI.
- [ ] **Adapt Table Logic (`USRateSheetTable.vue` - DexieJS Focus):**
  - Data Fetching: Fetch data via the store (`us-rate-sheet-store.ts`).
  - Filtering/Searching: Implement using DexieJS via service or filter store state.
  - Display Effective Date: Display single effective date from store.
  - Remove Discrepancy/Conflict UI.
  - Export Data: Modify `handleExport` to get current data from DexieJS via service.
  - Clear Data Interaction: Button handled in view.

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

## ❓ Open Questions & Prompts

To ensure the US Rate Sheet feature aligns perfectly with requirements, please clarify:

1.  **Effective Date Requirement:** We've made the Effective Date _optional_ during the modal confirmation step for `USRateSheetView.vue`. Is this correct? Or should it be _required_ before processing can start? If required, should the `PreviewModal` enforce this?
///this should be optional
2.  **Total Records Display:** The "Total Records Processed" stat currently shows `'---'`. Where should this count come from?
/// the number of rows that end up in the us_rate_sheet_db
    - Should `usRateSheetService.processFile` return the total valid _and_ invalid records attempted?
/// yes and we should store that for quick access in the @us-rate-sheet-store.ts
    - Should the store fetch the count from the DexieJS table (`db.entries.count()`) after a successful upload using a dedicated getter/action?
/// yes and that should be reactive, so as soon as it's available we shwo it
3.  **Invalid Rows Display:** `usRateSheetService.processFile` identifies `invalidRows`. How should these be displayed to the user in `USRateSheetView.vue`? Should we add a collapsible section similar to `AZRateSheetView.vue`?
/// yes exact same functionality and UI/UX
4.  **Data Clearing Logic:** The `catch` block in `handleModalConfirm` now calls `store.clearUsRateSheetData()`. Is this the desired behavior (i.e., clear any potentially partially saved data if _any_ error occurs during processing)?
/// I think this is an ok check - the data in DexieJS should persist until the user removes the file - just like in @az-rate-sheet-service.ts
5.  **Table Component (`USRateSheetTable.vue`):** What are the exact requirements for filtering and searching in the US rate sheet table? By NPA? NXX? Rate range? Should it load all data initially or paginate?
/// mostly the same functionality for now as with @AZRateSheetView. We won't have any rate confilicts in there so we will have different filters in there. We will be introdocing another set of data that we can use there, a population setting.
/// the idea is - is that the user can filter NPAS by state population, so the display will show a desending list of NPAs based on the state that is assigned to and the population of that state.
/// for now we should just leave the View Filter with the option of sorting alphabetically by state ascending and descending so we can get a framework for the additioanl information 

---

## Open Questions & Prompts

- **AZ Schema:** Confirm the `AZRateSheetEntry` type and the schema defined for `DBName.AZ_RATE_SHEET` in `DBSchemas` are fully aligned.
/// for now we should not be doing anything with AZ components or functionality - that is all working as expected
/// we need to make sure that nothing we are doing will effect that functionality
/// we will address the refactor of AZ Rate sheets after we finish US rate sheet Implementation
- **Table Component Refactor:** Decide if `USRateSheetTable` / `AZRateSheetTable` will fetch data via the store state or directly via service calls to Dexie.
/// for get about AZRateSheetTable for now - all focus is on @USRateSheetTable and yes it should fetch from Dexie.
/// it should also implement infinite scrolling like we are doing for @USPricingReport using the UsdetailedcomparisonTable

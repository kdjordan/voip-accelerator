# US Rate Sheet Surgeon: Refactor & Implementation Plan

## Goal

Create a robust US Rate Sheet management feature similar to the existing AZ Rate Sheet view (`RateSheetView.vue` / `RateSheetTable.vue`). This involves:

1.  **Refactoring:** Renaming existing AZ components for clarity.
2.  **Implementing US View:** Creating new US-specific components based on the refactored AZ code.
3.  **Integrating DexieJS (US):** Using DexieJS for storing and managing US Rate Sheet data, aligning with other US data patterns.
4.  **Integrating DexieJS (AZ):** Refactoring the AZ Rate Sheet components to also use DexieJS for consistency and robustness, moving away from the current Pinia/localStorage approach.

---

## Implementation Phases & Checklist

### Phase 1: Refactor Existing AZ Rate Sheet Components

- [ ] **Rename View:** Rename `client/src/pages/RateSheetView.vue` to `client/src/pages/AZRateSheetView.vue`.
- [ ] **Rename & Move Table:** Rename `client/src/components/rate-sheet/RateSheetTable.vue` to `client/src/components/rate-sheet/az/AZRateSheetTable.vue`. Create the `az` subdirectory if it doesn't exist.
- [ ] **Update Imports:** Update all imports referencing the old component names/paths (e.g., in router, `AZRateSheetView.vue`).
- [ ] **Verify AZ Functionality:** Briefly test the AZ Rate Sheet feature to ensure the renaming didn't break anything (it should still function using Pinia/localStorage for now).

### Phase 2: Create US Rate Sheet Component Foundation

- [ ] **Create US View:** Create `client/src/pages/USRateSheetView.vue` by copying and adapting the refactored `AZRateSheetView.vue`.
- [ ] **Create US Table:** Create `client/src/components/rate-sheet/us/USRateSheetTable.vue` by copying and adapting the refactored `AZRateSheetTable.vue`. Create the `us` subdirectory.
- [ ] **Update US View:** Modify `USRateSheetView.vue` to import and use `USRateSheetTable.vue`.
- [ ] **Add Routing:** Add a new route for `/us-rate-sheet` (or similar) pointing to `USRateSheetView.vue`.
- [ ] **Update Navigation:** Add a link in the UI (e.g., sidebar) to navigate to the new US Rate Sheet page.

### Phase 3: Implement US Rate Sheet Logic (DexieJS Integration)

- [ ] **Define US Column Mappings:**
  - Determine the required and optional columns for a US Rate Sheet CSV.
  - Create US-specific column role options (similar to `RF_COLUMN_ROLE_OPTIONS` but for US).
  - _**(Prompt):** What are the essential columns for a US Rate Sheet (e.g., OCN, State, Rate, NPA-NXX)? What optional columns might exist?_
- [ ] **Adapt Upload/Processing (`USRateSheetView.vue`):**
  - Update the `PreviewModal` props to use the new US column options.
  - Modify the `processFile` and `handleModalConfirm` logic.
  - Create/adapt a service (`usRateSheetService` or modify `rateSheetService`?) to:
    - Parse the US CSV based on mappings.
    - Standardize the data into a `USRateSheetEntry` interface (define this in `us-types.ts`?).
    - Store the standardized data in DexieJS.
    - _**(Prompt):** Which DexieJS database should store this US Rate Sheet data? `us_rate_deck_db` seems logical based on `overview.mdc`, but the AZ implementation used a separate store. Should we use `us_rate_deck_db` or create a new `us_rate_sheet_db`?_
    - _**(Prompt):** What should the table (object store) name be within the chosen Dexie database? Should it be a fixed name like `us_rate_sheet`, or dynamic based on an upload identifier (e.g., filename)? A single, fixed table seems more analogous to the AZ implementation's goal._
- [ ] **Update `us-store.ts`:**
  - Add state to track if a US Rate Sheet has been uploaded (e.g., `hasUsRateSheetData`, `usRateSheetTableName`).
  - Modify store actions/getters to interact with DexieJS metadata or perform simple checks (like table existence) rather than holding the full dataset.
- [ ] **Adapt Table Logic (`USRateSheetTable.vue` - DexieJS Focus):**
  - **Data Fetching:** Fetch and group data directly from the DexieJS table using appropriate queries (e.g., `groupBy('destinationName')` equivalent).
  - **Filtering/Searching:** Implement filters (status, change code) and search (name, prefix) using DexieJS `.where()` and `.filter()` clauses.
  - **Conflict Resolution:**
    - Modify `handleBulkUpdate` to perform DexieJS `bulkPut` or `update` operations.
    - Modify `saveRateSelection` to update individual records in DexieJS.
  - **Effective Date Setting:**
    - Create `client/src/workers/us-effective-date-updater.worker.ts` (based on the AZ worker).
    - Adapt worker logic to fetch data from and update records _within_ DexieJS. Pass the Dexie table name/DB name to the worker.
    - Update `applyEffectiveDateSettings` in the component to interact with this worker.
  - **Export Data:** Modify `handleExport` to query all relevant data from DexieJS based on current filters before generating the CSV.
  - **Clear Data:** Modify `handleClearData` to delete the specific DexieJS table or clear its contents.

### Phase 4: Refactor AZ Rate Sheet Storage (DexieJS Integration)

- [ ] **Define AZ DexieJS Storage:**
  - _**(Prompt):** Similar to US, which DexieJS database should store the processed AZ Rate Sheet data? `az_rate_deck_db` or a new `az_rate_sheet_db`?_
  - _**(Prompt):** What should the table name be? A fixed name like `az_rate_sheet`?_
- [ ] **Adapt Upload/Processing (`AZRateSheetView.vue`):**
  - Modify the `rateSheetService.processFile` (or create `azRateSheetService`?) to store standardized data in the chosen AZ DexieJS table instead of updating Pinia state directly.
  - Standardize data into an `AZRateSheetEntry` interface (if not already done).
- [ ] **Refactor `rate-sheet-store.ts`:**
  - Remove state variables that hold the actual rate sheet data (`originalData`, `groupedData`, potentially `invalidRows` if those can be derived).
  - Keep state for metadata (e.g., `hasStoredData`, `tableName`, `discrepancyCount`, `optionalFields`).
  - Modify actions/getters to interact with DexieJS (e.g., fetch `discrepancyCount` via a query).
- [ ] **Adapt Table Logic (`AZRateSheetTable.vue` - DexieJS Focus):**
  - Refactor all data fetching, filtering, searching, conflict resolution, effective date setting, export, and clearing logic to use DexieJS queries and updates against the AZ Rate Sheet table, mirroring the new US implementation.
  - Ensure the `effective-date-updater.worker.ts` is adapted to work with DexieJS for AZ data.

---

## Open Questions & Prompts

- **US Columns:** What are the essential and optional columns for US Rate Sheets?
- **US Dexie Storage:** `us_rate_deck_db` or `us_rate_sheet_db`? Fixed table name (e.g., `us_rate_sheet`) or dynamic?
- **AZ Dexie Storage:** `az_rate_deck_db` or `az_rate_sheet_db`? Fixed table name (e.g., `az_rate_sheet`)?
- **US Data Standardization:** Define the `USRateSheetEntry` interface structure.
- **Service Layer:** Should we have separate `azRateSheetService` / `usRateSheetService` or keep extending `RateSheetService`?

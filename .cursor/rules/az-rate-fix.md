# AZ Rate Sheet Refactor: Pinia/LocalStorage to IndexedDB (`useDexieDB`)


**Goal:** Refactor the AZ Rate Sheet feature (`AZRateSheetView.vue`, `AZRateSheetTable.vue`, `az-rate-sheet-store.ts`, `az-rate-sheet.service.ts`) to use IndexedDB for data storage via the `useDexieDB` composable, mirroring the architecture of the US Rate Sheet feature. This aims to significantly reduce memory consumption, improve performance, and enhance scalability while preserving all existing functionality and user experience.

**Current Architecture:**

- **Storage:** Data (potentially hundreds of thousands of records) is parsed and stored entirely in the Pinia store (`az-rate-sheet-store`), likely persisted to `localStorage`.
- **Data Handling:** The entire dataset is loaded into JavaScript memory. Filtering, grouping, searching, and discrepancy calculations are performed on this in-memory dataset within `AZRateSheetTable.vue` or the Pinia store.
- **Performance Issues:** High memory usage due to storing the full dataset; potential main thread blocking during `localStorage` reads/writes and large-scale computations (grouping, filtering) in JavaScript.

**Target Architecture:**

- **Storage:** Rate sheet data will be stored in an IndexedDB database (`az_rate_deck_db`) managed by the `useDexieDB` composable.
- **Data Handling:** `AZRateSheetTable.vue` will query only the necessary data subsets from IndexedDB based on current filters, search terms, and pagination/virtualization needs. Computations like grouping will occur on these smaller, queried subsets. Updates will be written back to IndexedDB.
- **Performance Gains:** Drastically reduced JavaScript heap usage; asynchronous DB operations; faster filtering/searching via IndexedDB indexes.

**Key Functionality to Preserve:**

- File Upload (Drag/Drop, Click) & Preview Modal (`PreviewModal`) with column mapping.
- Handling of invalid rows during parsing.
- Display of grouped data by `destinationName` in `AZRateSheetTable`.
- Row expansion to show details/adjustment controls.
- Filtering by status (conflicts, no-conflicts, change types).
- Debounced, asynchronous searching (by Name or Prefix Start) with result highlighting/expansion.
- **Discrepancy Resolution:**
  - Displaying conflicting rates with percentages/badges.
  - Unified adjustment controls (Markup/Markdown, Fixed/%, Direct Set) operating on a selected base rate.
  - Dynamic "Updated Rate" preview.
  - Saving resolved/adjusted rates back to storage.
- **Single-Rate Adjustment:** Using the same unified controls.
- **Effective Date Settings:**
  - UI controls for setting dates based on change type (SAME, INCREASE, DECREASE).
  - Applying settings via the Web Worker (`effective-date-updater.worker.ts`).
  - Progress indication during worker operation.
- **Bulk Discrepancy Resolution:** "Use Highest"/"Use Lowest" actions.
- Exporting currently stored data to CSV.
- Clearing all stored AZ rate sheet data.
- Tracking metadata: Total records, discrepancy count, invalid rows count, presence of optional columns (`hasMinDuration`, `hasIncrements`).

## Refactoring Plan: Step-by-Step

This plan aims for a systematic transition, minimizing disruption and regression.

**Phase 1: Database Setup & Data Ingestion**

1.  **Define Dexie Schema (`useDexieDB.ts` or dedicated types):**

    - Define the schema for the `az_rate_deck_db` database.
    - Create an `entries` table (object store) to hold `AZRateSheetEntry` objects (adapt the type if needed).
    - **Add Indexes:** Crucially, add indexes for efficient querying:
      - `destinationName` (for grouping and name searches)
      - `prefix` (for prefix searches)
      - `changeCode` (for filtering by change type)
      - `hasDiscrepancy` (boolean flag, for filtering conflicts - _Requires adding this flag during processing_)
      - Potentially compound indexes if needed (e.g., `[destinationName, prefix]`).
    - _(Self-Correction)_: Consider if `effectiveDate` needs an index for potential future filtering.

2.  **Modify `az-rate-sheet.service.ts` (`processFile`):**

    - Change the service's `processFile` method. Instead of returning the processed data array, it should:
      - Perform the CSV parsing and validation as before.
      - Add a `hasDiscrepancy` flag (initially `false`) to each record. _Alternatively, this flag could be calculated later, but adding it here might simplify initial queries._
      - Instantiate the `az_rate_deck_db` using `useDexieDB`.
      - Use `db.table('entries').bulkAdd(processedRecords)` to efficiently insert the data into IndexedDB.
      - Return metadata: total records processed, invalid rows list, presence of optional columns (`hasMinDuration`, `hasIncrements`).

3.  **Update `AZRateSheetView.vue` (Upload Logic):**
    - Adjust the `handleModalConfirm` method.
    - Call the modified `rateSheetService.processFile`.
    - On success, instead of dispatching data to the store, update store metadata (counts, flags) based on the service's return value.
    - Handle errors returned by the service.

**Phase 2: Store Refactoring**

1.  **Refactor `az-rate-sheet-store.ts`:**
    - **Remove State:** Delete `originalData`, `groupedData`, and any other state holding the full dataset.
    - **Keep/Adapt State:** Retain state for:
      - `totalRecords`: Updated after successful upload.
      - `discrepancyCount`: Needs a new calculation method (see Phase 4).
      - `invalidRows`: Retain as is, populated during upload.
      - `effectiveDateSettings`: Keep as is, potentially still persisted separately if needed across sessions.
      - `hasMinDuration`, `hasIncrements`: Flags set during upload.
      - `lastDbUpdateTime`: Add a timestamp ref, updated whenever Dexie data changes significantly (upload, clear, rate update, effective date update, bulk update), to signal the table component to reload.
    - **Remove Getters:** Delete getters relying on `originalData`/`groupedData` (e.g., `getGroupedData`, `getDiscrepancyCount` based on in-memory data).
    - **Adapt Actions:**
      - `clearData`: Modify to clear the `az_rate_deck_db.entries` table using `db.table('entries').clear()` and reset store metadata.
      - Actions related to rate updates (`updateDestinationRate`, `bulkUpdateDestinationRates`, `updateEffectiveDatesWithRecords`) will be significantly changed or triggered differently (see Phase 4 & 5).
    - **Remove `localStorage` Persistence:** Disable persistence for this store or configure it to only persist metadata like `effectiveDateSettings` if required.

**Phase 3: Table Data Loading & Display**

1.  **Refactor `AZRateSheetTable.vue` (Data Fetching):**

    - **Remove Store Dependency:** Stop relying on `store.getGroupedData`.
    - **Introduce Dexie:** Use `useDexieDB` to get an instance of `az_rate_deck_db`.
    - **Data Loading Strategy:** Implement an on-demand loading strategy. Since grouping is essential:
      - **Option A (Simpler, less scalable):** Query _all_ records matching current filters from Dexie, then perform grouping in JavaScript within the component. This mirrors the current logic but operates on potentially smaller, filtered datasets from Dexie. Might still be slow for very large filtered sets.
      - **Option B (More Complex, Scalable):**
        1. Query Dexie for _unique `destinationName`_ values matching filters.
        2. Implement pagination or virtual scrolling based on these unique names.
        3. For the _visible_ destination groups, query Dexie again to get the actual records belonging to those specific destinations.
        4. Perform grouping on these smaller batches.
      - _Recommendation:_ Start with Option A if feasible, but be prepared to switch to Option B if performance dictates.
    - **State:** Use local `ref`s to store the currently displayed (grouped) data.
    - **Loading State:** Add loading indicators while querying Dexie.
    - **Watchers:** Add a watcher on `store.lastDbUpdateTime` to trigger a data reload when the underlying DB changes. Also, add watchers for filter/search changes to re-query Dexie.

2.  **Adapt Filtering/Searching:**
    - Modify filter/search logic to build Dexie queries (`where(...).equals(...)`, `where(...).startsWithIgnoreCase(...)`, etc.) _before_ fetching data.
    - For status filters (conflicts, change types), query using the corresponding indexed fields (`hasDiscrepancy`, `changeCode`).
    - The prefix search needs careful implementation: If searching within a destination group (row expanded), filter the already-loaded group data in JS. If searching globally, query Dexie using `where('prefix').startsWithIgnoreCase(...)`. _This global prefix search might be less performant if the prefix index isn't highly selective._

**Phase 4: Grouping, Discrepancy Handling & Updates**

1.  **Grouping Logic:**

    - Move or adapt the grouping logic (currently likely in the store or table computed property) to operate on the data _fetched from Dexie_ in the previous step.
    - Perform discrepancy checks (`hasDiscrepancy` calculation, rate distribution) on the fetched data for each group. _Consider updating the `hasDiscrepancy` flag in Dexie records during this process if it wasn't added during ingestion._

2.  **Discrepancy Count (`az-rate-sheet-store`):**

    - Implement a new method in the store (or a composable) to calculate the discrepancy count. This will involve querying the Dexie `entries` table: `db.table('entries').where('hasDiscrepancy').equals(true).count()`. Call this after uploads or bulk updates.

3.  **Update Rate Logic (`AZRateSheetTable.vue` - `saveRateSelection`):**

    - When saving a change for a destination:
      - Determine the final rate to save (Direct > Adjusted > Selected Base).
      - Identify the primary keys (e.g., `id` or combination like `[destinationName, prefix]`) of the records in Dexie belonging to this destination.
      - Use `db.table('entries').bulkUpdate([{ key: pk1, changes: { rate: newRate, hasDiscrepancy: false } }, { key: pk2, changes: { rate: newRate, hasDiscrepancy: false } }, ...])` to update all relevant records atomically. Set `hasDiscrepancy` to `false`.
      - After successful update, update `store.lastDbUpdateTime` and potentially re-calculate the discrepancy count in the store.

4.  **Bulk Discrepancy Resolution (`AZRateSheetTable.vue` - `handleBulkUpdate`):**
    - Query Dexie for records where `hasDiscrepancy` is `true`.
    - Iterate through these records (potentially chunked using `each` or `bulkGet` for large numbers):
      - For each `destinationName`, find the highest/lowest rate among its conflicting records.
      - Prepare updates for all records belonging to that `destinationName`.
    - Use `db.table('entries').bulkUpdate(...)` to apply all calculated changes. Set `hasDiscrepancy` to `false` for updated records.
    - After success, update `store.lastDbUpdateTime` and re-calculate discrepancy count.

**Phase 5: Effective Date Worker & Export**

1.  **Refactor Effective Date Application (`AZRateSheetTable.vue` & Worker):**

    - **Main Thread:**
      - Query Dexie for the primary keys of _all_ records.
      - Pass the keys array (or potentially just filter criteria) and the `effectiveDateSettings` to the `effective-date-updater.worker.ts`. _Passing keys is safer than passing DB access._
    - **`effective-date-updater.worker.ts`:**
      - The worker can no longer directly access the Pinia store data.
      - It needs to receive the primary keys and settings.
      - It will need its _own_ Dexie connection to `az_rate_deck_db`.
      - Use `db.table('entries').bulkGet(chunkOfKeys)` to fetch records in batches.
      - Calculate the correct `effectiveDate` based on settings and the record's `changeCode`.
      - Prepare bulk updates: `[{ key: pk, changes: { effective: newDate } }, ...]`.
      - Use `db.table('entries').bulkUpdate(...)` to apply changes in batches.
      - Report progress back to the main thread as before.
    - **Main Thread (Completion):** On worker completion, update `store.lastDbUpdateTime`.

2.  **Refactor Export (`AZRateSheetTable.vue` - `handleExport`):**
    - Query Dexie for _all_ records in the `entries` table (or those matching current filters if desired).
    - Use `db.table('entries').toArray()` (or iterate with `each` if memory is still a concern even for export).
    - Format the data into CSV format as before.
    - Trigger the download.

**Phase 6: Testing & Cleanup**

1.  **Thorough Testing:**

    - Test all upload scenarios (small/large files, files with/without optional columns, invalid rows).
    - Verify all filtering and searching combinations.
    - Test discrepancy resolution (selecting rates, adjustments, direct set) extensively.
    - Test bulk updates ("Highest"/"Lowest").
    - Test effective date application with different settings.
    - Test export functionality.
    - Test clearing data.
    - **Crucially, monitor memory usage** using Chrome DevTools throughout testing to confirm the improvements. Compare heap snapshots before/after actions.
    - Test performance on large datasets.

2.  **Code Cleanup:**
    - Remove all unused code related to the old Pinia store data structures (`originalData`, `groupedData`, related getters/actions).
    - Remove any remnants of `localStorage` persistence for the main dataset.
    - Ensure all console logs used for debugging are removed or made conditional.

This refactor is indeed a significant undertaking, but addressing the core storage mechanism is essential for the application's health and scalability. Proceeding step-by-step and testing thoroughly at each phase will help manage the complexity. Let me know when you're ready to start implementing Phase 1.

**Plan for Implementing Sortable Columns**

This document outlines the plan to add sorting functionality to table columns in `USRateSheetTable.vue` and `USDetailedComparisonTable.vue`.

**I. `USRateSheetTable.vue` Implementation**

1.  **UI Enhancements for Table Headers:**

    - Convert static `<th>` elements for sortable columns (NPANXX, State, Country, Interstate Rate, Intrastate Rate, Indeterminate Rate, Effective Date) into interactive elements (e.g., buttons or clickable divs).
    - Implement a visual cue (e.g., an icon like `ArrowUpIcon` or `ArrowDownIcon` from Heroicons, or a combined `ChevronUpDownIcon` that changes) next to the column title to indicate:
      - The currently sorted column.
      - The sort direction (ascending/descending).
      - Columns that are sortable but not currently sorted.
    - Ensure the active sort indicator is visually distinct.

2.  **State Management for Sorting:**

    - Introduce reactive state variables:
      - `sortColumnKey = ref<keyof USRateSheetEntry | null>('npanxx')`: Stores the key of the column currently being sorted. Default to 'npanxx'.
      - `sortDirection = ref<"asc" | "desc">('asc')`: Stores the current sort direction. Default to 'asc'.
    - Define a list or type for sortable column keys to ensure type safety and map display names to data keys if necessary.
      ```typescript
      interface SortableColumn {
        key: keyof USRateSheetEntry;
        label: string; // Display label for the header
      }
      const sortableColumns: SortableColumn[] = [
        { key: "npanxx", label: "NPANXX" },
        { key: "stateCode", label: "State" }, // Assuming stateCode is the sortable key
        // ... other columns
      ];
      ```

3.  **Sorting Logic and Click Handler:**

    - Create a `handleSort(columnKey: keyof USRateSheetEntry)` function.
    - When a column header is clicked:
      - If `columnKey` is the same as `sortColumnKey.value`, toggle `sortDirection.value` (asc ↔ desc).
      - If `columnKey` is different, set `sortColumnKey.value` to the new `columnKey` and set `sortDirection.value` to 'asc' (default).
    - After updating sort state, trigger a data reload.

4.  **DexieJS Query Modifications:**

    - Update the `loadMoreData` function (and by extension, `resetPaginationAndLoad` which calls it).
    - The DexieJS query chain within `loadMoreData` needs to be modified to incorporate sorting:

      - If `sortColumnKey.value` is set, apply `.orderBy(sortColumnKey.value)` to the `queryChain`.
      - If `sortDirection.value` is 'desc', append `.reverse()` to the `queryChain` _after_ `.orderBy()`.
      - Example:

        ```typescript
        let queryChain = table; // or table.where(...) if filters are applied first

        // Apply existing filters (searchQuery, selectedState)
        if (debouncedSearchQuery.value) {
          /* ... */
        }
        if (selectedState.value) {
          /* ... */
        }

        // Apply sorting
        if (sortColumnKey.value) {
          queryChain = queryChain.orderBy(sortColumnKey.value);
          if (sortDirection.value === "desc") {
            queryChain = queryChain.reverse();
          }
        }

        // Then apply .offset().limit().toArray()
        ```

    - **Important:** The `stateCode` used for filtering in `USRateSheetTable` is derived from `entry.npa` via `lergStore`. Direct sorting on 'State' or 'Country' display values will be complex with Dexie if these are not actual fields in the `USRateSheetEntry` table.
      - For `State`, if `USRateSheetEntry` has a direct `stateCode` field that's populated during data ingestion, sorting by it is straightforward. The current code fetches `stateCode` from `lergStore.getLocationByNPA(entry.npa)?.region`. If we need to sort by this derived state, the data might need to be denormalized (add `stateCode` to `USRateSheetEntry` in Dexie) or sorted client-side after fetching (less ideal for pagination).
      - For initial implementation, let's assume `USRateSheetEntry` has a `stateCode` field that can be directly sorted. If not, sorting by 'State' and 'Country' might need to be deferred or handled differently. The current `fetchUniqueStates` uses `orderBy('stateCode').uniqueKeys()`, implying `stateCode` is a field.

5.  **Data Refresh and UI Feedback:**

    - When sort parameters change, call `resetPaginationAndLoad()`. This will:
      - Reset `offset.value` to 0.
      - Clear `displayedData.value`.
      - Show the `isFiltering.value = true` overlay.
      - Fetch the first page of data with the new sorting applied.
      - The infinite scroll mechanism should then work correctly with the sorted data.
    - The average calculations (`calculateAverages`) should generally not be affected by sort order as they operate on the entire filtered dataset.

6.  **Considerations for `formatRate` and Dates:**
    - Sorting currency/rate columns stored as numbers should work correctly.
    - Sorting date columns stored as ISO strings (e.g., 'YYYY-MM-DD') will also sort chronologically.

**II. `USDetailedComparisonTable.vue` Implementation**

The approach will be very similar to `USRateSheetTable.vue`.

1.  **UI Enhancements for Table Headers:**

    - Make headers for sortable columns (NPANXX, State, Country, File 1 Inter/Intra/Indeterm, File 2 Inter/Intra/Indeterm, Diff % columns) interactive with sort direction icons.

2.  **State Management for Sorting:**

    - Introduce component-specific reactive state:
      - `sortColumnKey = ref<keyof USPricingComparisonRecord | null>('npanxx')`
      - `sortDirection = ref<"asc" | "desc">('asc')`
    - Define sortable columns:
      ```typescript
      interface SortableUSComparisonColumn {
        key: keyof USPricingComparisonRecord;
        label: string;
      }
      // Example:
      // { key: 'npanxx', label: 'NPANXX' },
      // { key: 'stateCode', label: 'State' },
      // { key: 'file1_inter', label: 'File 1 Inter' },
      // { key: 'diff_inter_pct', label: 'Diff Inter %' },
      ```

3.  **Sorting Logic and Click Handler:**

    - Implement `handleSort(columnKey: keyof USPricingComparisonRecord)` to update sort state and trigger data reload.

4.  **DexieJS Query Modifications (Reflecting Key Learnings):**

    - Update the `loadMoreData` function (and `resetAndFetchData` which calls it).
    - The approach should mirror the hybrid strategy developed for `USRateSheetTable.vue`:

      ```typescript
      // Inside loadMoreData for USDetailedComparisonTable.vue
      const table = dbInstance.table<USPricingComparisonRecord>(COMPARISON_TABLE_NAME);
      let query: Dexie.Table<USPricingComparisonRecord, any> | Dexie.Collection<USPricingComparisonRecord, any> = table;
      let dbSortApplied = false;

      // 1. Apply Primary Indexed Filters (if applicable)
      // Example: if searchTerm filters on an indexed 'npanxx' or 'stateCode' directly
      if (searchTerm.value && /* is simple indexed query for searchTerm */) {
        // query = query.where('someIndexedField').startsWithIgnoreCase(searchTerm.value);
      } else if (selectedState.value && /* is simple indexed query for state */) {
        // query = query.where('stateCode').equals(selectedState.value);
      }
      // Note: USDetailedComparisonTable often involves more complex client-side filtering
      // based on multiple criteria (searchTerm across several fields, state, diff types etc.).
      // So, primary indexed filters might be less common here, or combined with client-side.

      // 2. Attempt DB-Level Sorting (on the potentially filtered Table/WhereClause)
      if (typeof (query as any).orderBy === 'function') {
        if (sortColumnKey.value) {
          try {
            query = (query as any).orderBy(sortColumnKey.value);
            if (sortDirection.value === 'desc') {
              query = (query as any).reverse();
            }
            dbSortApplied = true;
          } catch (dbSortError) {
            console.error('[USDetailedComparisonTable] DB Sort error:', dbSortError);
            dbSortApplied = false; // Ensure fallback if DB sort fails
          }
        }
      }

      // 3. Apply Complex/Client-Side Filters
      // USDetailedComparisonTable typically builds a `currentFilters` array of functions
      // and applies them using `query.filter(record => currentFilters.every(fn => fn(record)))`.
      // This will likely convert `query` to a generic Dexie.Collection if it wasn't already.
      const currentFilters: Array<(record: USPricingComparisonRecord) => boolean> = [];
      // ... (build currentFilters based on searchTerm, selectedState, diff preferences etc.) ...
      if (currentFilters.length > 0) {
        query = query.filter(record => currentFilters.every(fn => fn(record)));
      }

      // 4. Count Records (Clone before count if query object is reused)
      let totalFilteredRecords = 0;
      if (currentOffset === 0) { // Only count for the first page load
        totalFilteredRecords = await query.clone().count();
      }

      // 5. Fetch Paginated Data
      let newData = await query.offset(offset.value).limit(pageSize).toArray();

      // 6. Fallback to Client-Side Sorting if DB Sort wasn't applied
      if (!dbSortApplied && sortColumnKey.value) {
        newData.sort((a, b) => {
          const valA = (a as any)[sortColumnKey.value!];
          const valB = (b as any)[sortColumnKey.value!];
          let comparison = 0;
          // Handle nulls/undefined to sort them consistently
          if (valA === null || valA === undefined) comparison = -1;
          else if (valB === null || valB === undefined) comparison = 1;
          else if (valA > valB) comparison = 1;
          else if (valA < valB) comparison = -1;
          return sortDirection.value === 'asc' ? comparison : comparison * -1;
        });
      }

      // ... (update component state with newData, newOffset, hasMoreData, totalFilteredRecords)
      ```

    - **Indexed Fields**: Ensure that fields frequently used for sorting or as primary standalone filters (like `npanxx`, potentially `stateCode`, and any core rate/diff fields if performance dictates) are indexed in the `USPricingComparisonRecord` Dexie table schema. This is crucial for the `query.where(...)` and DB-level `orderBy(...)` to be effective.
    - The existing filter logic in `USDetailedComparisonTable.vue` (which often iterates through `file1_` and `file2_` properties and calculates differences on the fly for filtering) will likely mean that most filtering results in a `Dexie.Collection` before sorting can be fully applied by the DB. The client-side sort fallback will be important.

5.  **Data Refresh and UI Feedback:**

    - Call `resetAndFetchData()` on sort changes.
    - Use `isLoading.value` and `isFiltering.value` for visual feedback.
    - The `calculateFullFilteredAverages` should remain unaffected by sort order.

6.  **Numeric and Percentage Columns:**
    - Rate columns (e.g., `file1_inter`) and percentage difference columns (e.g., `diff_inter_pct`) are numeric and should sort as expected. Handle `null` or `undefined` values (Dexie usually sorts these first).

**III. General Considerations for Both Tables**

- **Accessibility:** Use `aria-sort` attribute on `<th>` elements to indicate sort status to assistive technologies.
- **Styling:** Ensure clickable headers have appropriate hover/focus styles.
- **Initial Load:** Decide if tables should have a default sort order on initial load (e.g., by NPANXX ascending). The current plan defaults to this.
- **Performance:**
  - For `USRateSheetTable.vue`, ensure `npanxx` and `stateCode` have Dexie indices if they are frequently sorted. Other rate fields might also benefit from indices if sorting them is slow on large datasets.
  - For `USDetailedComparisonTable.vue`, `npanxx` and `stateCode` in `comparison_results` table should ideally be indexed. Rate and diff columns as well if sorting proves to be a bottleneck.
- **Testing:** Thoroughly test sorting with various filter combinations, on empty datasets, and with datasets containing `null`/`undefined` values in sortable columns.

**IV. Key Learnings from `USRateSheetTable.vue` for Dexie.js Sorting**

1.  **`Table.orderBy()` vs. `Collection.orderBy()` vs. `Collection.sortBy()`:**

    - Dexie's `Table` and `WhereClause` objects (returned by `table.where(...)`) have an efficient, indexed `orderBy(indexName)` method. This should be the preferred way to sort.
    - When you apply a client-side filter function using `query.filter(record => booleanFunction(record))`, the result is a generic `Dexie.Collection`.
    - A `Dexie.Collection` _may_ still have an `orderBy(indexName)` method if the underlying data source is still queryable by an index. However, if the collection is the result of more complex operations or multiple client-side filters, `orderBy` might not be available or might not work as expected (as seen with the `queryChain.orderBy is not a function` error).
    - `Dexie.Collection` also has a `sortBy(indexName)` method, which performs an in-memory sort on the items currently in the collection. This is suitable for client-side sorting after data is fetched or after client-side filtering, but it's generally less performant than indexed `orderBy` for large datasets because it operates on potentially large arrays in memory.

2.  **Order of Operations Matters:**

    - **Ideal:** Apply `where()` clauses first, then `orderBy()`, then `reverse()` (if needed), then `offset().limit().toArray()`.
    - If a filter requires a client-side JavaScript function (e.g., `query.filter(fn)`), this often converts the chain to a generic `Collection`.
    - If `orderBy()` needs to be applied _after_ such a `.filter(fn)` call, it might fail if the specific `Collection` instance doesn't support it directly for the given key.

3.  **Hybrid Sorting Strategy (DB-first, Client Fallback):**

    - **Attempt DB Sort:** Always try to apply `orderBy()` to the Dexie `Table` or `WhereClause` object as early as possible, before any operations that might convert it to a generic `Collection` where `orderBy` might not be available (like `.filter(fn)`).
    - **Track DB Sort Success:** Use a flag (e.g., `dbSortApplied`) to know if the database-level sort was successfully initiated.
    - **Client-Side Filter:** Apply any necessary client-side filters (e.g., `query = query.filter(fn)`).
    - **Fetch Data:** Execute `query.offset().limit().toArray()`.
    - **Fallback to Client Sort:** If `dbSortApplied` is `false` (meaning the DB sort didn't happen or failed) and a sort key is active, then perform a client-side sort on the fetched `newData` array (e.g., using `newData.sort((a,b) => ...)`).
    - This ensures that indexed sorting is used when possible but provides a robust fallback for more complex filter/sort combinations.

4.  **`Collection.clone()` for Counting:**

    - When calculating the total number of records matching the current filters and sort (`query.count()`), it's crucial to call `.count()` _before_ applying `.offset()` and `.limit()`.
    - If the `query` object might be further modified (e.g., for pagination), use `query.clone().count()` to ensure the count is performed on the correct, complete filtered/sorted set.

5.  **Handling `null`/`undefined` in Client-Side Sort:**
    - When implementing a custom JavaScript `array.sort((a,b) => ...)` comparator, explicitly handle `null` or `undefined` values for the sort key to prevent errors and ensure consistent sorting (e.g., always place them at the beginning or end).

This refined understanding will guide the implementation of sorting in `USDetailedComparisonTable.vue`, which also uses Dexie and has its own set of filters.

**V. Troubleshooting File Upload & Data Processing Issues (US Rate Deck Analyzer)**

This section documents the attempts made to resolve issues encountered with file uploads, `stateCode` processing, `USCodeSummary.vue` display, and the inability to upload multiple files in the US Rate Deck Analyzer.

1.  **Initial Error & Symptom:**

    - Error in UI: `this.lergStore.getRegionCodeByNPA is not a function`.
    - Prevents file processing.

2.  **Troubleshooting `getRegionCodeByNPA` Error:**

    - **Investigation:**
      - Confirmed `getRegionCodeByNPA` was not a valid method on `lergStore`.
      - Identified the call was being made in `client/src/services/us.service.ts`.
      - Found that `lergStore` provides `getOptimizedLocationByNPA()` which returns `{ country: string; region: string } | null`.
    - **Attempted Fix (Applied):**
      - Modified `client/src/services/us.service.ts` to use `this.lergStore.getOptimizedLocationByNPA(npa)`.
      - Updated logic to extract `stateCode` from `locationInfo.region`, defaulting to `'XX'` if `locationInfo` or `locationInfo.region` was null/empty.
    - **Outcome:** The "is not a function" error was resolved. However, this led to new symptoms.

3.  **New Symptoms After Initial Fix:**

    - `stateCode` in DexieJS (`us_rate_deck_db` -> `us-1` table) was often empty or `'XX'`.
    - `USCodeSummary.vue` displayed incorrect/broken data (e.g., 0% coverage, incorrect NPA counts).
    - Unable to upload a second file after the first one was processed (UI stuck).
    - Persistent console warning: `[UseDexieDB] Received empty schema string for us_rate_deck_db. Defining no stores.`

4.  **Troubleshooting Empty/Incorrect `stateCode` and Dexie Schema:**

    - **Investigation (Dexie Schema):**
      - Found `DBSchemas[DBName.US]` in `client/src/types/app-types.ts` was an empty string (`''`).
      - This caused `useDexieDB.ts` to initialize `us_rate_deck_db` with no tables defined initially.
      - The `addStore` function in `useDexieDB.ts` was falling back to a default `'++id'` schema for dynamically created tables (e.g., `us-1`), as `DynamicTableSchemas` was not yet defined or correctly referenced for `DBName.US`.
    - **Attempted Fix (Dexie Schema - Applied):**
      - Defined `DynamicTableSchemas` in `client/src/types/app-types.ts`.
      - Provided a full schema string for `DynamicTableSchemas[DBName.US]` (e.g., `'++id, &npanxx, npa, nxx, stateCode, ...'`).
    - **Outcome (Dexie Schema):** Tables like `us-1` were created with more appropriate indexes. `stateCode` started appearing in Dexie (e.g., "AK"). The "Defining no stores" warning for the DB itself persisted. `stateCode` for some NPAs (like `939` for Puerto Rico) was still `'XX'`. Issues with `USCodeSummary.vue` and uploading a second file remained.

5.  **Troubleshooting `stateCode: 'XX'` for specific NPAs (e.g., Puerto Rico 'PR' - NPA 939):**
    - **Investigation (LERG Processing):**
      - Confirmed `lergStore._populateNpaToLocationMap()` sets `region: ''` for NPAs classified under "otherCountries".
      - The logic `locationInfo && locationInfo.region ? locationInfo.region : 'XX'` in `us.service.ts` correctly defaults to `'XX'` if the LERG data provides an empty region.
      - Traced the issue to `client/src/types/constants/state-codes.ts` not including `'PR'` (Puerto Rico) and other US territories.
      - This caused `lergService.isUSState('PR')` to return `false`.
      - In `useLergData.ts` (function `updateStoreData`), NPAs for states/territories not in `STATE_CODES` were filtered out before being set into `lergStore.usStates`.
    - **Attempted Fix (LERG - Applied):**
      - Added `'PR': { name: 'Puerto Rico', region: 'Territory' }` to `STATE_CODES` in `client/src/types/constants/state-codes.ts`.
      - Instructed to clear site data to ensure `lergStore` repopulates correctly.
    - **Outcome (LERG):** User reported this did not resolve the remaining issues (`USCodeSummary.vue` still broken, unable to upload a second file).

**Summary of Unresolved Issues (as of last interaction):**

- `USCodeSummary.vue` remains broken or inaccurate.
- Inability to upload a second file (UI state likely not resetting).
- The console warning `[UseDexieDB] Received empty schema string for us_rate_deck_db. Defining no stores.` might still indicate an underlying issue with initial DB setup, even if dynamic tables are now better schemed.
- The root cause for `stateCode` being `'XX'` for NPAs like `939` needs re-verification in LERG data flow post-`STATE_CODES` update, including clearing site data by the user.

**VI. AZRateSheetTable.vue - Implemented Sorting Functionality (Session dd/mm/yyyy)**

This section outlines how sortable columns were implemented in `AZRateSheetTable.vue`, drawing inspiration from the `USRateSheetTable.vue` implementation and adapting for client-side sorting of in-memory data.

1.  **UI Enhancements for Table Headers:**

    - The `<thead>` in `AZRateSheetTable.vue` was modified.
    - Sortable columns implemented: Destination, Codes, Rate, Change, Effective. Conditionally sortable columns (if visible based on `store.hasMinDuration` and `store.hasIncrements`): Duration, Increments.
    - Column headers were made interactive.
    - Visual cues (`ArrowUpIcon`, `ArrowDownIcon`, `ChevronUpDownIcon`) were added to indicate sort status.
    - `cursor-pointer`, hover styles, and `aria-sort` attribute were applied for accessibility and UX.

2.  **State Management for Sorting (within `<script setup>`):**

    - Reactive state variables were introduced:
      ```typescript
      const sortColumnKey = ref<string | null>("destinationName");
      const sortDirection = ref<"asc" | "desc">("asc");
      ```
    - A `computed` property `tableHeaders` was created using the `SortableAZColumn` interface to define column properties (key, label, sortable, textAlign, and `getValue` for complex data extraction, e.g., `group.codes.length` or dynamic rate display).
      ```typescript
      interface SortableAZColumn {
        key: string;
        label: string;
        sortable: boolean;
        textAlign?: string;
        getValue?: (
          group: GroupedRateData,
          selectedRatesRef: Ref<Record<string, number>>
        ) => any;
      }
      // ... (implementation of tableHeaders computed property as added in AZRateSheetTable.vue)
      ```

3.  **Sorting Logic and Click Handler:**

    - A `handleSort(column: SortableAZColumn)` function was implemented. It updates `sortColumnKey` and `sortDirection` when a sortable header is clicked, which triggers re-computation of `filteredData`.

4.  **`filteredData` Computed Property Modification:**

    - The `filteredData` computed property was modified to include sorting as the final step after filtering.
    - The sorting logic operates on the `GroupedRateData` array, using the `getValue` function from the `tableHeaders` configuration where necessary.
    - It correctly handles string, number, null, and undefined comparisons, and respects the `sortDirection`.

5.  **Table Header Rendering:**

    - The `<thead>` section in the template was refactored to loop through `tableHeaders.value`.
    - Each `<th>` dynamically renders its label, binds click events to `handleSort`, and displays sort icons based on current sort state.

6.  **Reset Sorting on Filter/Search Changes:**

    - A `watch` effect was added for `filterStatus` and `debouncedSearchQuery` to reset `sortColumnKey` to 'destinationName' and `sortDirection` to 'asc' when these filters change.

7.  **Adherence to Best Practices:**
    - The implementation uses existing project patterns and avoids new external dependencies.

This implementation provides robust client-side sorting for the `AZRateSheetTable.vue` component.

**VII. `AZDetailedComparisonTable.vue` - Plan for Sorting Functionality (New Plan)**

This plan outlines the steps to implement sortable columns in `AZDetailedComparisonTable.vue`. It considers that data fetching is paginated via an API call (`azService.getPagedDetailedComparisonData`) and aims for server-side sorting as the primary approach, with client-side sorting as a fallback if necessary for the initially loaded page or if server-side is not immediately feasible.

1.  **UI Enhancements for Table Headers:**

    - Modify the existing `<thead>` in `AZDetailedComparisonTable.vue`.
    - Identify sortable columns based on `AZDetailedComparisonEntry` properties: Dial Code (`dialCode`), Match Status (`matchStatus`), File 1 Dest Name (`destName1`), File 2 Dest Name (`destName2`), File 1 Rate (`rate1`), File 2 Rate (`rate2`), Diff (`diff`), Diff % (`diffPercent`), Cheaper File (`cheaperFile`).
    - Make column headers interactive with click handlers for sortable columns.
    - Add visual cues (e.g., `ArrowUpIcon`, `ArrowDownIcon`, `ChevronUpDownIcon`) for sort status.
    - Apply `cursor-pointer`, hover styles, and `aria-sort` attributes.

2.  **State Management for Sorting (within `<script setup>`):**

    - Introduce reactive state variables:
      ```typescript
      const sortColumnKey = ref<keyof AZDetailedComparisonEntry | null>(null); // Or a string if using custom keys
      const sortDirection = ref<"asc" | "desc">("asc");
      ```
    - Define a `tableHeaders` computed property (similar to `AZRateSheetTable.vue`) to manage header definitions, labels, sortability, and data extraction logic (if needed).

      ```typescript
      interface SortableAZCompColumn {
        key: keyof AZDetailedComparisonEntry | string; // Allow string for potentially derived keys
        label: string;
        sortable: boolean;
        textAlign?: string;
        // Optional getValue for complex cases, though most might be direct keys
        getValue?: (record: AZDetailedComparisonEntry) => any;
      }

      const tableHeaders = computed<SortableAZCompColumn[]>(() => [
        {
          key: "dialCode",
          label: "Dial Code",
          sortable: true,
          textAlign: "center",
        },
        {
          key: "matchStatus",
          label: "Match Status",
          sortable: true,
          textAlign: "center",
        },
        {
          key: "destName1",
          label: `Dest Name (${fileName1.value})`,
          sortable: true,
          textAlign: "center",
        }, // fileName1 is already a computed prop
        {
          key: "destName2",
          label: `Dest Name (${fileName2.value})`,
          sortable: true,
          textAlign: "center",
        }, // fileName2 is already a computed prop
        {
          key: "rate1",
          label: `Rate (${fileName1.value})`,
          sortable: true,
          textAlign: "center",
        },
        {
          key: "rate2",
          label: `Rate (${fileName2.value})`,
          sortable: true,
          textAlign: "center",
        },
        { key: "diff", label: "Diff", sortable: true, textAlign: "center" },
        {
          key: "diffPercent",
          label: "Diff %",
          sortable: true,
          textAlign: "center",
        },
        {
          key: "cheaperFile",
          label: "Cheaper File",
          sortable: true,
          textAlign: "center",
        },
      ]);
      ```

3.  **Sorting Logic and Click Handler:**

    - Create a `handleSort(columnKey: keyof AZDetailedComparisonEntry | string)` function.
    - When a column header is clicked:
      - If `columnKey` is the same as `sortColumnKey.value`, toggle `sortDirection.value`.
      - Otherwise, set `sortColumnKey.value` to `columnKey` and `sortDirection.value` to 'asc'.
    - After updating sort state, call `resetAndFetchData()` to reload data with new sort parameters.

4.  **Data Fetching Modifications (`fetchData` and `resetAndFetchData`):**

    - **Primary Goal: Server-Side Sorting.**

      - The `AZDetailedComparisonFilters` interface (in `az-types.ts`) will be extended to include optional `sortKey?: string;` and `sortDir?: 'asc' | 'desc';`.
      - The `azService.getPagedDetailedComparisonData` method will be updated to accept these new sort parameters.
      - The backend (NestJS service `AZService` method `getPagedDetailedComparisonData`) will need to be modified to use these parameters in its database query (likely for a Dexie table query on the backend if it mirrors the US comparison structure).
      - In `AZDetailedComparisonTable.vue`, the `fetchData` function will pass `sortColumnKey.value` and `sortDirection.value` to `azService.getPagedDetailedComparisonData` if they are set.
      - `resetAndFetchData` will ensure these sort parameters are also passed.

    - **Client-Side Sorting (as a lesser fallback, if server-side is complex or delayed):**
      - If server-side sorting cannot be immediately implemented, sorting would be applied to `comparisonData.value` _after_ data is fetched. This is less ideal for pagination as it only sorts the currently accumulated data.
      - The sorting logic would resemble that in `AZRateSheetTable.vue`, applied directly to the `comparisonData.value` array. This might be triggered within a `watch` on `comparisonData` or after `fetchData` completes.
      - This approach means sorting is only fully effective once all data is loaded, or it re-sorts the visible dataset with each new page, which can be jarring.

5.  **Backend Modifications (if pursuing server-side sorting):**

    - The NestJS `AZService` (`az.service.ts` on the server) method `getPagedDetailedComparisonData` (or equivalent that queries the AZ comparison data, potentially from a Dexie instance on the server if that's the architecture) needs to:
      - Accept `sortKey` and `sortDir` as parameters.
      - Dynamically apply `.orderBy(sortKey)` and potentially `.reverse()` to its Dexie query based on these parameters before pagination (`.offset().limit()`).
      - Handle potential errors if an invalid `sortKey` is provided.

6.  **General Considerations (from Section III):**
    - **Accessibility:** Use `aria-sort` on `<th>`.
    - **Initial Load:** Decide on a default sort order (e.g., by `dialCode` ascending) and apply it on initial load.
    - **Reset Sorting on Filter Changes**: Similar to `AZRateSheetTable.vue`, watch other filters (`searchTerm`, `selectedCheaper`, `selectedMatchStatus`) and reset sort to default if they change.
    - **Performance:** Server-side sorting is generally more performant for large datasets with pagination. Ensure any backend Dexie tables used for comparison results have appropriate indices on sortable columns.
    - **Testing:** Thoroughly test with various filter combinations and sort orders.

This plan prioritizes server-side sorting for a better user experience with paginated data. If this proves too complex for initial implementation, a client-side sort of the currently loaded `comparisonData.value` can be a temporary measure, with the understanding of its limitations.

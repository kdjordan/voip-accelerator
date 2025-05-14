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

# Table Pagination Implementation Strategy

**Objective:** Transition all data-heavy table views from infinite scroll (or basic display) to a standardized pagination system. This aims to improve UI consistency, provide predictable data navigation, enhance performance for large datasets, and clarify sorting behaviors.

---

## Phase 1: `USRateSheetTable.vue` (Reference Implementation)

- **Status:** Accomplished.
- This component serves as the primary reference for pagination UI, state management, data fetching logic (`fetchPageData`), and integration with filters and sorting.

---

## Phase 2: Transition `USDetailedComparisonTable.vue` to Pagination

**Objective:** Maintain UI/UX consistency with `USRateSheetTable.vue` by transitioning `USDetailedComparisonTable.vue` from infinite scroll to a pagination-based layout.

**Current State:** Uses infinite scroll (`useIntersectionObserver`). Data is loaded from a client-side Dexie.js database (`comparison_results` table in `DBName.US_PRICING_COMPARISON`). Complex client-side calculations for rate differences are performed.

**Implementation Plan:**

1.  **State Management:**

    - Introduce `currentPage = ref(1)`.
    - Introduce `itemsPerPage = ref(50)` (or a suitable default, e.g., 100).
    - Introduce `totalFilteredItems = ref(0)` (to be updated from `query.count()` after filters, before pagination).
    - Introduce `itemsPerPageOptions = ref([25, 50, 100, 250])` (or similar).

2.  **UI for Pagination Controls:**

    - Implement pagination controls below the table, mirroring `USRateSheetTable.vue` (First/Previous/Next/Last buttons, direct page input, items per page selector).
    - Display "Page X of Y" and "Total: Z records" using `currentPage`, `totalPages` (computed), and `totalFilteredItems`.

3.  **Refactor Data Loading Logic:**

    - Rename/replace existing `loadMoreData` (and remove `useIntersectionObserver`) with `fetchPageData(page: number)`.
    - `fetchPageData` will:
      - Calculate `offset = (page - 1) * itemsPerPage.value`.
      - Build a Dexie query on the `comparison_results` table.
      - Apply current filters (NPANXX search term, selected state) to the query.
      - **Crucially**, fetch the `totalFilteredItems` by applying `query.count()` _before_ pagination and sorting are applied to the main data fetch.
      - Apply sorting:
        - Attempt DB-level sorting via `query.orderBy()` based on `currentSortKey` and `currentSortDirection`.
        - Given the client-side diff calculations (`diff_inter_pct`, etc.), these specific columns might not be directly in Dexie for `orderBy`. If sorting by these, the sort will need to occur client-side on the fetched page of data. For direct DB columns, `orderBy` should be attempted.
        - Set `isPerformingPageLevelSort` based on whether a full DB sort was feasible for the current view or if a client-side page sort was performed.
      - Apply pagination to the query: `query.offset(offset).limit(itemsPerPage.value)`.
      - Fetch the data for the current page: `await query.toArray()`.
      - Update `displayedData.value` (or equivalent ref for table rows) and `totalFilteredItems.value`.

4.  **Loading Experience:**

    - Implement a loading state (e.g., `isFiltering` or `isPageLoading`) managed by `goToPage` (and other pagination actions) to show a loading overlay during page transitions, similar to `USRateSheetTable.vue`.

5.  **Integration with Filters & Sorting:**

    - Modify watchers for `searchTerm` and `selectedState` to call a new function like `resetPaginationAndLoad()` (which internally calls `fetchPageData(1)`).
    - Ensure `handleSort` function also calls `resetPaginationAndLoad()`.

6.  **Average Calculations:**
    - The existing `calculateFullFilteredAverages` function already fetches all filtered data to compute averages. This should remain largely unchanged, as pagination applies to the _display_ of data, not necessarily the full dataset for aggregate calculations.

**Considerations:**

- The complexity of filters and client-side computed diffs in `USDetailedComparisonTable.vue` means that global DB-level sorting for _all_ columns might be challenging. Client-side sorting of the fetched page, coupled with UI transparency (cues/messages for page-level sort via `isPerformingPageLevelSort`), will be important.

---

## Phase 3: Implement Client-Side Pagination UI for `AZDetailedComparisonTable.vue`

**Objective:** Align `AZDetailedComparisonTable.vue` with the standard pagination UI, leveraging its existing server-side paginated data fetching.

**Current State:** Fetches paginated data from a backend API via `azService.getPagedDetailedComparisonData`. Sorting is also handled server-side by passing sort parameters to the API.

**Implementation Plan:**

1.  **State Management:**

    - Introduce `currentPage = ref(1)`.
    - Introduce `itemsPerPage = ref(50)` (or a suitable default).
    - Introduce `totalFilteredItems = ref(0)` (this will be populated from the API response, which should include the total count of items matching filters on the server).
    - Introduce `itemsPerPageOptions = ref([25, 50, 100, 250])`.

2.  **UI for Pagination Controls:**

    - Implement the standard pagination controls below the table.

3.  **Adapt Data Loading Logic (`fetchData`):**

    - The existing `fetchData(tableName, reset)` function (or similar) in `AZDetailedComparisonTable.vue` already handles fetching paginated data by calling `azService.getPagedDetailedComparisonData`.
    - This service call accepts `pageSize` and `offset`.
    - Modify `fetchData` (or a new `fetchPageData`) to:
      - Calculate `offset = (currentPage.value - 1) * itemsPerPage.value`.
      - Pass `itemsPerPage.value` as `limit` and the calculated `offset` to `azService.getPagedDetailedComparisonData`.
      - Pass current sort parameters (`sortColumnKey.value`, `sortDirection.value`) to the service.
      - The API response should ideally return the `totalFilteredItems` count from the server. Update `totalFilteredItems.value` from this response.
      - Update `comparisonData.value` with the data returned for the page.

4.  **Loading Experience:**

    - Manage an `isLoading` or `isPageLoading` state during API calls for page changes to display a loading indicator.

5.  **Integration with Filters & Sorting:**
    - When filters (`searchTerm`, `selectedCheaper`, `selectedMatchStatus`) or sorting (`sortColumnKey`, `sortDirection`) change:
      - Set `currentPage.value = 1`.
      - Call the updated `fetchData` (or `fetchPageData`) to load the first page with new filter/sort parameters.

---

## Phase 4: Transition `AZRateSheetTable.vue` (within `AZRateSheetView.vue`) to Pagination

**Objective:** Implement pagination for the A-Z rate sheet display, which currently loads all data into memory for client-side filtering and sorting.

**Current State:** Data is loaded from `az-rate-sheet-store` (likely from IndexedDB/localStorage). Filtering and sorting are performed client-side on the full in-memory dataset.

**Implementation Plan:**

1.  **State Management:**

    - Introduce `currentPage = ref(1)`.
    - Introduce `itemsPerPage = ref(100)` (or a suitable default).
    - Introduce `totalFilteredItems = ref(0)` (this will be the count of items after client-side filters are applied).
    - Introduce `itemsPerPageOptions = ref([25, 50, 100, 250, 500])`.

2.  **UI for Pagination Controls:**

    - Implement standard pagination controls.

3.  **Computed Property for Paginated Data:**

    - The core data source is likely a computed property that filters and sorts the full dataset from the store (e.g., `filteredAndSortedData`).
    - Create a new computed property, say `paginatedData`, that depends on `filteredAndSortedData`, `currentPage`, and `itemsPerPage`.
    - Inside `paginatedData`:
      - First, update `totalFilteredItems.value = filteredAndSortedData.value.length`.
      - Calculate `startIndex = (currentPage.value - 1) * itemsPerPage.value`.
      - Calculate `endIndex = startIndex + itemsPerPage.value`.
      - Return `filteredAndSortedData.value.slice(startIndex, endIndex)`.
    - The table will then iterate over `paginatedData`.

4.  **Loading Experience:**

    - Since filtering, sorting, and pagination will be very fast for in-memory data, a full-screen loading overlay might not be necessary for page changes. However, if filtering/sorting the full dataset takes noticeable time, the existing `isLoading` state tied to those operations should cover it.

5.  **Integration with Filters & Sorting:**
    - When existing client-side filters or sort criteria change (triggering a re-computation of `filteredAndSortedData`):
      - Set `currentPage.value = 1` to ensure the user sees the first page of the new results. This should be done in the watchers or functions that handle filter/sort changes.

**Considerations:**

- This approach keeps the data processing (filtering, sorting) client-side as it is now, only adding a slicing mechanism for display. It's efficient if the total dataset size is manageable in memory.
- If the underlying "full dataset" from the store is very large, then a DB-level pagination approach (like in `USRateSheetTable.vue`) would be more performant, requiring `AZRateSheetTable.vue` to query its data source (e.g., IndexedDB) with pagination and filter parameters rather than loading everything into memory. For now, assuming the current in-memory approach is acceptable, and we are just paginating the display of that.

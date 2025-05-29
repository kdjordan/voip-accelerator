# Revised Plan for A-Z Rate Sheet Table Pagination (AZRateSheetTable.vue)

## 1. Goal

Refactor `AZRateSheetTable.vue` to use the pagination, filtering, and sorting mechanisms provided by the `useAZTableData.ts` composable, drawing inspiration from the successful implementation in `AZDetailedComparisonTable.vue`. This plan addresses the unique challenge of `AZRateSheetTable.vue`'s need to display data grouped by destination, while paginating and filtering flat `AZFlatRateEntry` records from Dexie.

## 2. Core Principles from `AZDetailedComparisonTable.vue`

- **Composable-Driven Data**: All data fetching, pagination, primary sorting, and primary filtering for flat records are managed by `useAZTableData`.
- **Reactive State**: Component state (filters, current page selection) drives the composable.
- **Clear UI**: Consistent UI for loading, error, no-data states, and pagination controls.
- **Flat Data Operations**: The composable operates on a flat list of records stored in Dexie.

## 3. Key Challenges for `AZRateSheetTable.vue`

- **Data Grouping**: Unlike `AZDetailedComparisonTable.vue` which displays flat data, `AZRateSheetTable.vue` must group the paginated `AZFlatRateEntry[]` (from `displayedData`) into `GroupedRateData[]` for its primary table display.
- **Actions on Grouped Data**: User actions (selecting rates, adjusting rates, saving changes) are performed on a group but must translate to updates on the underlying individual `AZFlatRateEntry` items in Dexie.
- **`useRateSheetDisplayLogic`**: The functionality previously expected from an import of `useRateSheetDisplayLogic` (e.g., `formatDate`, `getSortedRates`, `isSelectedRate`) needs to be correctly sourced or implemented. Given previous errors, these will be initially defined locally within `AZRateSheetTable.vue` and adapted.

## 4. Step-by-Step Implementation Plan

### Step 4.1: Composables and Initial Setup

1.  **Import `useAZTableData`**:
    ```typescript
    import { useAZTableData } from "@/composables/tables/useAZTableData";
    import type { FilterFunction } from "@/composables/tables/useTableData";
    import { DBName } from "@/types/app-types";
    import type {
      AZFlatRateEntry,
      GroupedRateData,
      RateStatistics,
      RateSheetRecord,
      AdjustmentType,
      AdjustmentValueType,
    } from "@/types/domains/rate-sheet-types";
    import {
      ChangeCode,
      type ChangeCodeType,
    } from "@/types/domains/rate-sheet-types";
    import { useAzRateSheetStore } from "@/stores/az-rate-sheet-store"; // Keep for now if any global state is still needed (e.g. effective date settings for new entries if that feature is kept)
    ```
2.  **Initialize `useAZTableData`**:

    - Set `dbName: DBName.AZ_RATE_SHEET`.
    - Set `tableName: 'az_rate_sheet_entries'`.
    - Set appropriate defaults for `itemsPerPage` (e.g., 100), `sortKey` (e.g., `'code'`), and `sortDirection` (e.g., `'asc'`).

    ```typescript
    const store = useAzRateSheetStore(); // Evaluate if still needed beyond this plan

    const {
      displayedData, // This will be AZFlatRateEntry[]
      totalFilteredItems,
      isDataLoading,
      isFiltering,
      dataError,
      currentPage,
      itemsPerPage,
      itemsPerPageOptions,
      totalPages,
      canGoToPreviousPage,
      canGoToNextPage,
      directPageInput,
      currentSortKey, // Refers to fields in AZFlatRateEntry
      currentSortDirection, // Refers to fields in AZFlatRateEntry
      initializeDB,
      resetPaginationAndLoad,
      goToFirstPage,
      goToPreviousPage,
      goToNextPage,
      goToLastPage,
      handleDirectPageInput,
      dbInstance, // For bulk updates and full exports
    } = useAZTableData<AZFlatRateEntry>({
      dbName: DBName.AZ_RATE_SHEET,
      tableName: "az_rate_sheet_entries",
      itemsPerPage: 100,
      sortKey: "code", // Default sort for flat entries
      sortDirection: "asc",
    });
    ```

3.  **Local UI State**:
    - `filterStatus` (for 'all', 'conflicts', etc.)
    - `searchQuery` (for text search)
    - `expandedRows`: `ref<string[]>([])`
    - `selectedRates`: `ref<Record<string, number>>({})` (for discrepancy resolution)
    - `originalRates`: `ref<Record<string, number>>({})` (to track original rate before adjustment for single-rate groups)
    - `singleRateAdjustments`: `ref<Record<string, { adjustmentType: AdjustmentType; adjustmentValueType: AdjustmentValueType; adjustmentValue: number | null; }>>({})`
    - `directSetRates`: `ref<Record<string, number | null>>({})`
    - `userExplicitlySelectedRate`: `ref<Record<string, boolean>>({})`

### Step 4.2: Implement Client-Side Data Grouping (`locallyGroupedData`)

1.  Create a `computed` property named `locallyGroupedData` that:

    - Takes `displayedData.value` (the current page of flat `AZFlatRateEntry` items) as input.
    - Transforms it into `GroupedRateData[]`.
    - **Logic**:
      - Group entries by `destinationName`.
      - For each group, calculate:
        - `codes`: Array of codes in the group _on the current page_.
        - `rates`: `RateStatistics[]` based on rates present _on the current page_ for that group.
          - `isCommon` within `RateStatistics` should be based on frequency _within the current page's group data_.
        - `hasDiscrepancy`: True if more than one unique rate exists for the group _on the current page_.
        - `effectiveDate`: Use the first entry's `effectiveDate` or a sensible default.
        - `changeCode`: **Placeholder/Simplify**. Set to `ChangeCode.SAME` initially. Accurate derivation from paged flat data is complex.
        - `minDuration`, `increments`: Aggregate or take the first defined value from entries in the group _on the current page_.

    ```typescript
    const locallyGroupedData = computed<GroupedRateData[]>(() => {
      if (!displayedData.value || displayedData.value.length === 0) {
        return [];
      }
      const grouped = new Map<
        string,
        {
          codes: string[];
          ratesMap: Map<number, number>; // rate -> count
          effectiveDates: string[];
          minDurations: (number | undefined)[];
          increments: (number | undefined)[];
        }
      >();

      displayedData.value.forEach((entry) => {
        if (!grouped.has(entry.destinationName)) {
          grouped.set(entry.destinationName, {
            codes: [],
            ratesMap: new Map(),
            effectiveDates: [],
            minDurations: [],
            increments: [],
          });
        }
        const destGroup = grouped.get(entry.destinationName)!;
        destGroup.codes.push(entry.code);
        destGroup.ratesMap.set(
          entry.rate,
          (destGroup.ratesMap.get(entry.rate) || 0) + 1
        );
        if (entry.effectiveDate)
          destGroup.effectiveDates.push(entry.effectiveDate);
        destGroup.minDurations.push(entry.minDuration);
        destGroup.increments.push(entry.increments);
      });

      return Array.from(grouped.entries()).map(([destinationName, data]) => {
        const totalCodesInGroupOnPage = data.codes.length;
        const rateStats: RateStatistics[] = [];
        let maxPercentage = 0;
        Array.from(data.ratesMap.entries()).forEach(([rate, count]) => {
          const percentage = (count / totalCodesInGroupOnPage) * 100;
          rateStats.push({ rate, count, percentage, isCommon: false });
          if (percentage > maxPercentage) {
            maxPercentage = percentage;
          }
        });
        // Mark most common on page
        rateStats.forEach((rs) => {
          if (rs.percentage === maxPercentage && maxPercentage > 0)
            rs.isCommon = true;
        });

        const hasDiscrepancy = data.ratesMap.size > 1;
        const effectiveDate =
          data.effectiveDates.length > 0
            ? data.effectiveDates[0]
            : new Date().toISOString().split("T")[0];

        // Initialize singleRateAdjustments for this group if not present
        if (
          !singleRateAdjustments.value[destinationName] &&
          !hasDiscrepancy &&
          rateStats.length > 0
        ) {
          singleRateAdjustments.value[destinationName] = {
            adjustmentType: "markup",
            adjustmentValueType: "percentage",
            adjustmentValue: null,
          };
          originalRates.value[destinationName] = rateStats[0].rate; // Store original for non-discrepancy
        } else if (
          !singleRateAdjustments.value[destinationName] &&
          hasDiscrepancy
        ) {
          singleRateAdjustments.value[destinationName] = {
            adjustmentType: "markup",
            adjustmentValueType: "percentage",
            adjustmentValue: null,
          };
        }

        return {
          destinationName,
          codes: data.codes,
          rates: rateStats.sort((a, b) => b.percentage - a.percentage), // Display sorted by commonality
          hasDiscrepancy,
          effectiveDate,
          changeCode: ChangeCode.SAME, // Placeholder
          minDuration: data.minDurations.find((md) => md !== undefined),
          increments: data.increments.find((inc) => inc !== undefined),
        };
      });
    });
    ```

### Step 4.3: Implement Display Logic Functions Locally

Define these functions within `<script setup>` of `AZRateSheetTable.vue`. Adapt them to use `locallyGroupedData`, `selectedRates`, etc.

- `formatDate(dateString: string | undefined): string`
- `formatRate(rate: number | undefined): string`
- `getSortedRates(group: GroupedRateData): RateStatistics[]` (should already be sorted by `locallyGroupedData`)
- `isSelectedRate(destinationName: string, rate: number): boolean`
- `getAdjustmentTypeLabel(type: AdjustmentType | undefined): string`
- `getAdjustmentValueTypeLabel(type: AdjustmentValueType | undefined): string`
- `hasPendingChanges(destinationName: string): boolean`
- `getPendingUpdatedRate(destinationName: string): number | null`
- `handleToggleExpandRow(destinationName: string)`: Manages `expandedRows.value`.

### Step 4.4: Filtering Logic

1.  **`createFilters(): FilterFunction<AZFlatRateEntry>[]`**:
    - This function will generate an array of filter functions for `useAZTableData`.
    - It should use `searchQuery.value` to filter `AZFlatRateEntry` items by `destinationName` (contains) or `code` (starts with).
    ```typescript
    function createFilters(): FilterFunction<AZFlatRateEntry>[] {
      const filters: FilterFunction<AZFlatRateEntry>[] = [];
      const query = searchQuery.value.toLowerCase().trim();
      if (query) {
        filters.push(
          (entry) =>
            entry.destinationName.toLowerCase().includes(query) ||
            entry.code.toLowerCase().startsWith(query)
        );
      }
      // NOTE: 'filterStatus' (conflicts, etc.) is NOT applied here. It's applied client-side post-grouping.
      return filters;
    }
    ```
2.  **`debouncedResetPaginationAndLoad`**: Use `useDebounceFn` from `@vueuse/core`.
    ```typescript
    const debouncedResetPaginationAndLoad = useDebounceFn(async () => {
      await resetPaginationAndLoad(createFilters());
    }, 300);
    ```
3.  **Watchers for Primary Filters**:
    - Watch `searchQuery`. On change, call `debouncedResetPaginationAndLoad()`.
4.  **`filteredAndSortedGroupedData` (Client-Side Filtering/Sorting for Groups)**:

    - This `computed` property takes `locallyGroupedData.value`.
    - Applies `filterStatus.value` (e.g., 'conflicts', 'no-conflicts') to filter the groups.
    - If client-side sorting of _groups_ is needed (for columns not on `AZFlatRateEntry`), implement it here.

    ```typescript
    const filteredAndSortedGroupedData = computed(() => {
      let dataToDisplay = [...locallyGroupedData.value];

      // Apply filterStatus (client-side on grouped data)
      if (filterStatus.value === "conflicts") {
        dataToDisplay = dataToDisplay.filter((group) => group.hasDiscrepancy);
      } else if (filterStatus.value === "no-conflicts") {
        dataToDisplay = dataToDisplay.filter((group) => !group.hasDiscrepancy);
      } // ... other ChangeCode filters if re-implemented accurately later

      // Potential client-side sorting for grouped data here if a header.sortable is false
      // Example: if (clientSortKey.value === 'codesCount') dataToDisplay.sort(...)

      return dataToDisplay;
    });
    ```

    - The main table in the template will `v-for` over `filteredAndSortedGroupedData`.

### Step 4.5: Sorting Logic

1.  **`handleSort(column: SortableAZColumn)`**: ( `SortableAZColumn` interface needs to be defined similar to existing, but keys refer to `AZFlatRateEntry` fields if `column.sortable` is true).
    - If `column.sortable` is true (meaning it's a field on `AZFlatRateEntry`):
      - Update `currentSortKey.value` and `currentSortDirection.value` from `useAZTableData`.
      - Call `resetPaginationAndLoad(createFilters())`.
    - If `column.sortable` is false (e.g., "Codes (on page)"), it implies client-side sorting on `filteredAndSortedGroupedData` if desired.
2.  **Table Headers**:
    - `tableHeaders` computed property should define columns.
    - `key` should correspond to `AZFlatRateEntry` fields for DB-sortable columns.
    - `sortable: true` for DB-sortable columns, `false` otherwise.

### Step 4.6: UI Implementation

1.  **Conditional Rendering**: Use `isDataLoading`, `dataError`, `filteredAndSortedGroupedData.length === 0` for loading, error, and no-data states.
2.  **Pagination Controls**:
    - Implement UI similar to `AZDetailedComparisonTable.vue`.
    - Bind to `itemsPerPage`, `directPageInput`.
    - Use `itemsPerPageOptions`, `totalPages`, `canGoToPreviousPage`, `canGoToNextPage`.
    - Call `goToFirstPage(createFilters())`, `goToPreviousPage(createFilters())`, etc.
3.  **Table Rendering**:
    - `v-for="group in filteredAndSortedGroupedData"` for the main rows.
    - Expanded rows (`v-if="expandedRows.includes(group.destinationName)"`) will display adjustment controls.

### Step 4.7: Actions in Expanded Rows (Critical)

1.  **`selectRate(destinationName: string, rate: number)`**:
    - Updates `selectedRates.value[destinationName] = rate`.
    - Sets `userExplicitlySelectedRate.value[destinationName] = true`.
    - Resets `singleRateAdjustments.value[destinationName].adjustmentValue = null` and `directSetRates.value[destinationName] = null`.
2.  **`saveRateSelection(group: GroupedRateData)`**:
    - **This is the most complex part.**
    - Set a loading state for this specific group (e.g., `isSavingChanges.value = group.destinationName`).
    - Determine the `finalRate` to apply:
      - If `directSetRates.value[group.destinationName]` is set, use that.
      - Else, calculate from `selectedRates.value[group.destinationName]` (or `originalRates.value[group.destinationName]` if not a discrepancy) plus adjustments from `singleRateAdjustments.value[group.destinationName]`.
    - If `finalRate` is determined:
      - Fetch all `AZFlatRateEntry` items from Dexie for this `group.destinationName`:
        ```typescript
        const entriesToUpdate = await dbInstance.value
          ?.table("az_rate_sheet_entries")
          .where("destinationName")
          .equals(group.destinationName)
          .toArray();
        ```
      - If `entriesToUpdate` exist, map over them, updating their `rate` to `finalRate`. Consider if `effectiveDate` also needs updating based on store settings or a new UI element.
      - Perform a `bulkPut` operation:
        ```typescript
        await dbInstance.value
          ?.table("az_rate_sheet_entries")
          .bulkPut(updatedEntries);
        ```
      - Call `await resetPaginationAndLoad(createFilters())` to refresh the current page view.
      - Clear pending changes for this group (e.g., reset adjustmentValue, directSetRate).
    - Clear loading state (`isSavingChanges.value = null`).
    - Handle errors.

### Step 4.8: Bulk Actions (`handleBulkUpdate`, `handleBulkUpdateMostCommon`)

1.  Set global `isBulkProcessing.value = true`.
2.  Fetch **ALL** `AZFlatRateEntry` items from Dexie matching `createFilters()` (no pagination).
    ```typescript
    const allMatchingEntries = await dbInstance.value
      ?.table("az_rate_sheet_entries")
      .filter((entry) => currentFilters.every((fn) => fn(entry))) // Apply createFilters()
      .toArray();
    ```
3.  Group these `allMatchingEntries` by `destinationName`.
4.  For each destination group, determine the target rate based on the bulk action mode ('highest', 'lowest', 'mostCommon').
5.  Identify all original `AZFlatRateEntry` items belonging to these destination groups that need updating.
6.  Prepare a batch update for Dexie (e.g., using `bulkPut`) to change the `rate` for all affected flat entries.
7.  Call `await resetPaginationAndLoad(createFilters())` to refresh the current page.
8.  Set `isBulkProcessing.value = false`. Provide UI feedback.

### Step 4.9: Export CSV (`handleExport`)

1.  Set loading state (e.g., reuse `isBulkProcessing` or a new `isExporting` ref).
2.  Fetch **ALL** filtered `AZFlatRateEntry` items from Dexie (similar to bulk actions).
3.  **Export Format**:
    - **Option A (Simple - Recommended Start)**: Export the flat `AZFlatRateEntry[]` directly. Map to `RateSheetRecord` like structure if desired but keep it simple. `changeCode` will be a placeholder.
    - **Option B (Complex)**: Group the full flat dataset and try to reconstruct a more formalized output. This is significantly harder.
4.  Use `papaparse` to generate CSV content.
5.  Trigger download.
6.  Clear loading state.

### Step 4.10: Other Functionality

1.  **`handleClearData()`**:
    - Confirm with user.
    - `await dbInstance.value?.table('az_rate_sheet_entries').clear();`
    - `await resetPaginationAndLoad(createFilters());`
    - `store.clearData();` (if store is still managing some related global state)
2.  **`onMounted`**:
    - `await initializeDB();`
    - `await resetPaginationAndLoad(createFilters());`
3.  **Watchers**:
    - `watch([searchQuery /* any other primary filters */], debouncedResetPaginationAndLoad);`
    - `watch(itemsPerPage, () => resetPaginationAndLoad(createFilters()));`
    - `watch(filterStatus, () => { /* This will trigger re-computation of filteredAndSortedGroupedData, no DB call needed */ });`

### Step 4.11: Dexie Indexing (Reminder)

- In `client/src/composables/useDexieDB.ts` (or Dexie setup location):
  - Ensure `az_rate_sheet_entries` table has indexes on: `destinationName`, `code`, and any other frequently sorted/filtered `AZFlatRateEntry` fields (e.g., `rate`, `effectiveDate`).
  ```typescript
  // Example in Dexie setup
  db.version(X).stores({
    // ... other stores
    az_rate_sheet_entries:
      "++id, destinationName, code, rate, effectiveDate, minDuration, increments",
    // ...
  });
  ```

## 5. Phased Rollout & Testing

1.  **Phase 1 (Core Pagination & Display)**: Implement steps 4.1, 4.2, 4.3 (basic display functions), 4.4 (DB filtering for search), 4.5 (DB sorting), 4.6 (UI shells), 4.10 (`onMounted`, basic watchers). Get flat data paginating and basic grouping for display.
2.  **Phase 2 (Expanded Row Display & Basic Interactions)**: Fully implement step 4.3, `handleToggleExpandRow`. Display adjustment controls. `selectRate` functionality.
3.  **Phase 3 (Saving Changes)**: Critically implement `saveRateSelection` (Step 4.7). This is complex.
4.  **Phase 4 (Client-Side Group Filtering)**: Fully implement `filteredAndSortedGroupedData` and `filterStatus` watcher (Step 4.4).
5.  **Phase 5 (Bulk Actions & Export)**: Implement steps 4.8 and 4.9.
6.  **Phase 6 (Cleanup & Refinement)**: Address `ChangeCode` if feasible, optimize, add detailed comments, ensure all store interactions are purposeful. Implement Dexie indexing (Step 4.11).

This revised plan provides a more structured approach, prioritizing the correct use of the composable for flat data and then layering the grouping and specific interaction logic for `AZRateSheetTable.vue`.

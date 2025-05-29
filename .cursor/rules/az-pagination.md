# Pagination Implementation Plan for AZRateSheetTable.vue

This document outlines the step-by-step plan to implement client-side pagination in `AZRateSheetTable.vue`, drawing inspiration from the pagination implemented in `AZDetailedComparisonTable.vue`.

## Key Differences from AZDetailedComparisonTable.vue

- **Data Source**: `AZRateSheetTable.vue` uses a Pinia store (`useAzRateSheetStore`) and a computed property (`filteredData`) for its data, which is already filtered and sorted. Pagination will be applied client-side to this `filteredData` array.
- **No Data Composable for Pagination**: Unlike `AZDetailedComparisonTable.vue` which uses `useAZTableData` for data fetching and pagination logic from IndexedDB, `AZRateSheetTable.vue` will manage pagination state and logic locally within the component itself, as it operates on an already available in-memory array.

## Phased Implementation Plan

### Phase 1: Setup Pagination State and Basic UI Elements

1.  **Define Reactive State Variables**:
    - In `<script setup>` of `AZRateSheetTable.vue`, add `ref`s for pagination:
      - `currentPage = ref(1)`
      - `itemsPerPage = ref(50)` (or a suitable default like 25 or 50)
      - `itemsPerPageOptions = ref([10, 25, 50, 100, 250])`
2.  **Add UI Placeholders for Pagination Controls**:
    - Below the table (or in a suitable location, similar to `AZDetailedComparisonTable.vue`), add basic HTML structure for:
      - An items per page `<select>` dropdown (can use Headless UI Listbox for consistency if preferred, or a simple select).
      - "First", "Previous", "Next", and "Last" buttons (using `BaseButton`).
      - A current page input field.
      - Display for "Page X of Y".
      - Display for "Showing N-M of Z items".
    - Initially, these controls will not be functional but will lay the groundwork for styling and structure.

### Phase 2: Create Paginated Data Source

1.  **Computed Property for `totalPages`**:
    - Create a `computed` property `totalPages` that calculates the total number of pages based on `filteredData.value.length` and `itemsPerPage.value`.
      ```typescript
      const totalPages = computed(() => {
        if (!filteredData.value || filteredData.value.length === 0) {
          return 1; // Or 0, depending on desired behavior for no items
        }
        return Math.ceil(filteredData.value.length / itemsPerPage.value);
      });
      ```
2.  **Computed Property for `paginatedData`**:
    - Create a `computed` property `paginatedData` that slices `filteredData.value` based on `currentPage.value` and `itemsPerPage.value`.
      ```typescript
      const paginatedData = computed(() => {
        if (!filteredData.value) {
          return [];
        }
        const start = (currentPage.value - 1) * itemsPerPage.value;
        const end = start + itemsPerPage.value;
        return filteredData.value.slice(start, end);
      });
      ```
3.  **Update Table Rendering**:
    - Modify the `<template>` to iterate over `paginatedData` instead of `filteredData` for rendering the table rows.
      ```html
      <template v-for="group in paginatedData" :key="group.destinationName">
        <!-- ... existing row template ... -->
      </template>
      ```
    - The "Showing X destinations" text should continue to use `filteredData.value.length` to show the total count before pagination.

### Phase 3: Implement Pagination Logic and Wire UI Controls

1.  **Implement Navigation Functions**:
    - `goToNextPage()`: Increments `currentPage.value` if `currentPage.value < totalPages.value`.
    - `goToPreviousPage()`: Decrements `currentPage.value` if `currentPage.value > 1`.
    - `goToFirstPage()`: Sets `currentPage.value = 1`.
    - `goToLastPage()`: Sets `currentPage.value = totalPages.value`.
    - `handleDirectPageInput(eventOrValue: Event | number)`: Handles direct input to jump to a specific page.
      - It should parse the input, validate it (between 1 and `totalPages.value`), and update `currentPage.value`.
      - A separate `ref` like `directPageInput = ref(currentPage.value)` can be used for the input field.
    - `handleItemsPerPageChange(newItemsPerPage: number)`: Updates `itemsPerPage.value` and resets `currentPage.value = 1`.
2.  **Computed Properties for UI State**:
    - `canGoToPreviousPage = computed(() => currentPage.value > 1)`
    - `canGoToNextPage = computed(() => currentPage.value < totalPages.value)`
3.  **Connect UI Controls**:
    - Bind the items per page `<select>`/Listbox to `itemsPerPage.value` and its `@update:modelValue` (or `@change`) to `handleItemsPerPageChange`.
    - Connect "First", "Previous", "Next", "Last" buttons to their respective functions.
    - Conditionally disable buttons using `canGoToPreviousPage` and `canGoToNextPage`.
    - Bind the page input field and use its `@keyup.enter` or a "Go" button to trigger `handleDirectPageInput`. Ensure the input reflects `currentPage` but allows user entry.
4.  **Update Display Information**:
    - Create computed properties or use inline template expressions for:
      - "Page {{ currentPage }} of {{ totalPages }}"
      - "Showing {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredData.length) }} of {{ filteredData.length }} entries" (handle zero items case).

### Phase 4: Integrate with Filters and Sorting

1.  **Reset Current Page on Filter/Sort Changes**:
    - Modify existing `watch`ers for `filterStatus`, `debouncedSearchQuery`, and the `handleSort` function.
    - When any of these primary data-altering conditions change, reset `currentPage.value = 1`.
    - This ensures users always start on the first page of the newly filtered/sorted dataset.
2.  **Ensure `totalPages` Reactivity**:
    - The `totalPages` computed property should automatically react to changes in `filteredData.value.length`. Double-check this behavior after implementing filters and sorting integration.

### Phase 5: UI Refinements and Edge Cases

1.  **Styling**:
    - Style the pagination controls using `BaseButton` (with appropriate `variant` and `size`) and Tailwind CSS to match the application's theme. Refer to `AZDetailedComparisonTable.vue` for styling examples.
    - Ensure consistent spacing and alignment.
2.  **Empty/Loading State**:
    - When `filteredData.value.length` is 0 (e.g., no search results or no data loaded):
      - Pagination controls should ideally be hidden or disabled gracefully.
      - The existing "No destinations found..." or loading messages should remain prominent.
    - If `isSearching.value` is true, pagination might also need to be temporarily disabled or reflect the loading state.
3.  **Accessibility**:
    - Ensure pagination controls are accessible:
      - Proper ARIA attributes for buttons and input fields (e.g., `aria-label`, `aria-current` for the current page).
      - Ensure keyboard navigability.
4.  **Responsiveness**:
    - Check how pagination controls look and function on smaller screen sizes. They might need to stack or simplify.

### Phase 6: Testing and Refinement

1.  **Thorough Testing**:
    - Test pagination with various data sizes (no items, few items, many items spanning multiple pages).
    - Test all `itemsPerPage` options.
    - Verify interaction with all existing filters (`filterStatus`, `searchQuery`).
    - Verify interaction with column sorting.
    - Test direct page input: valid numbers, invalid numbers (too low, too high, non-numeric).
    - Test "First", "Previous", "Next", "Last" buttons at boundary conditions.
    - Test behavior when data is cleared (`handleClearData`).
2.  **Performance Considerations**:
    - Client-side pagination on a pre-filtered array should be performant.
    - Monitor UI responsiveness, especially when changing filters or items per page with large datasets, as this will trigger re-computation of `paginatedData` and `totalPages`.

This phased approach aims to introduce pagination incrementally, allowing for easier debugging and verification at each step.

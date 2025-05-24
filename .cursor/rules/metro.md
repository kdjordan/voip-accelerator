# Metro Area Filter Implementation Plan (Phased)

## Phase 1: Implement Metro Filter in USRateSheetTable.vue (Completed)

### 1. Analyze and Prepare Data

- Review `metro-population.ts` for structure and export a list of metro area keys and display names for dropdowns.
- Ensure a type for MetroArea exists (or create one in `types/domains/metro-types.ts`).

### 2. Add Metro Filter UI

- In `USRateSheetTable.vue`, add a new dropdown (Listbox) for Metro Area, above or alongside the State filter.
- Populate options from `metro-population.ts`.
- Include an option for "All Metro Areas" (default, no filter).

### 3. Metro Filter State Management

- Add a new `selectedMetro` ref in the component.
- Watch for changes to `selectedMetro` and trigger data reloads (like state/NPANXX filters).

### 4. Metro Filter Logic in Data Fetching

- When a metro is selected:
  - Get the list of NPAs for that metro.
  - Filter the data so that only entries whose NPA (first 3 digits of NPANXX) is in that list are shown.
  - Combine with other filters: If state or NPANXX is also set, apply all filters together (intersection).
- Use Dexie/IndexedDB `.filter()` or `.where()` for efficient filtering if possible; otherwise, filter in-memory after fetching.

### 5. UI/UX Details

- Show the active filter in the UI (e.g., "Filtering by: New York Metro").
- Decide whether to disable state filter when metro is selected, or allow both (intersection logic).
- Reset pagination and scroll position on filter change.

### 6. Testing and Edge Cases

- Test combinations: Metro + State, Metro + NPANXX, etc.
- Show a clear message if no records match.
- Ensure filtering is efficient for large datasets.

### 7. Code Organization

- Extract metro filter logic into a composable or helper if reused.
- Keep types and constants in their own files.

### 8. Documentation

- Add comments explaining the filter logic.
- Update README or in-app help if needed.

### 9. (Optional) Advanced

- Show metro population in dropdown for context.
- Allow multi-select for metros (future enhancement).

---

## Phase 2: Implement Metro Filter in `USDetailedComparisonTable.vue` (Revised Plan)

This plan incorporates user feedback to implement a multi-select metro area filter in `USDetailedComparisonTable.vue`, ensuring UI/UX consistency with `USRateSheetTable.vue` and clear intersection logic for all filters.

### Step-by-Step Implementation Plan for `USDetailedComparisonTable.vue`

**Step 1: Setup Data Sources and Import Necessary Types/Constants**

1.  **Import Metro Constants**: In `<script setup lang="ts">` of `USDetailedComparisonTable.vue`:
    - Import `metroAreaOptions` and `MetroAreaOption` from `client/src/types/constants/metro-population.ts`.
2.  **Import Headless UI Components**: Ensure `Menu`, `MenuButton`, `MenuItems`, `MenuItem` (and potentially `Listbox` components if not already present for other filters) are imported from `@headlessui/vue`.
3.  **Import Icons**: Ensure `CheckIcon`, `ChevronUpDownIcon`, `MagnifyingGlassIcon`, `XCircleIcon` are imported from `@heroicons/vue/20/solid` (or similar, matching `USRateSheetTable.vue`).

**Step 2: Implement Metro Filter UI in `<template>`**

1.  **Metro Filter Dropdown (`Menu` Component)**:
    - Place this dropdown logically with other filter controls (e.g., near State filter).
    - Use a `MenuButton` to display the current selection status (e.g., "All Metro Areas", "New York Metro", or "3 Metro Areas Selected").
    - Inside `MenuItems`:
      - Add a search input field (`<input type="text" v-model="metroSearchQuery">`) for filtering the list of metro areas.
      - Add a "Select Visible" / "Deselect Visible" button.
      - Add a "Clear All Selected Metros" button.
      - Iterate through `filteredMetroOptions` (computed property, defined later) using `MenuItem`.
        - For each metro: display its `displayName` and `population` (formatted).
        - Use a `CheckIcon` to indicate if a metro is selected.
        - Handle click events to toggle metro selection.
2.  **Selected Metros Chips Display**:
    - Below the filter controls, if `selectedMetros.value.length > 0`, display a list of chips.
    - Each chip should show the `displayName` of a selected metro and include an 'x' button to remove it.
3.  **Metro Filter Summary Section**:
    - If `selectedMetros.value.length > 0`, display:
      - Text like: `"{{ selectedMetros.length }} metro area(s) selected."`
      - Text like: `"Total Affected Population: {{ totalSelectedPopulation.toLocaleString() }}"`
      - A summary of targeted NPAs: `"{{ targetedNPAsDisplay.summary }}"` (with a tooltip for the full list if it's long, like in `USRateSheetTable.vue`).

**Step 3: Implement State Management in `<script setup lang="ts">`**

1.  **Reactive State Variables**:
    - `const selectedMetros = ref<MetroAreaOption[]>([]);`
    - `const metroSearchQuery = ref('');`
2.  **Computed Properties**:
    - `metroButtonLabel`: Returns the dynamic label for the `MenuButton` based on `selectedMetros.value`.
    - `filteredMetroOptions`: Filters `metroAreaOptions` based on `metroSearchQuery.value` (case-insensitive search on `displayName`).
    - `totalSelectedPopulation`: Calculates `selectedMetros.value.reduce((sum, metro) => sum + metro.population, 0);`.
    - `targetedNPAsDisplay`: Generates an object `{ summary: string, fullList: string }` for the NPAs targeted by `selectedMetros`. The NPAs are derived from `metro.areaCodes` for each selected metro. Ensure uniqueness and sorting of NPAs displayed.
    - `areAllMetrosSelected`: Checks if all metros in `filteredMetroOptions.value` are present in `selectedMetros.value`.
    - `metroAreaCodesToFilter = computed<string[]>(() => [...new Set(selectedMetros.value.flatMap(metro => metro.areaCodes))]);` (Used for actual data filtering).
3.  **Helper Functions (similar to `USRateSheetTable.vue`)**:
    - `toggleMetroSelection(metro: MetroAreaOption)`: Adds/removes a metro from `selectedMetros`.
    - `isMetroSelected(metro: MetroAreaOption): boolean`: Checks if a metro is in `selectedMetros`.
    - `handleSelectAllMetros()`: Selects/deselects all metros currently visible in `filteredMetroOptions`.
    - `removeSelectedMetro(metro: MetroAreaOption)`: Removes a metro from the `selectedMetros` chips.
    - `clearMetroSearch()`: Clears `metroSearchQuery`.
    - `clearAllSelectedMetros()`: Clears `selectedMetros` and `metroSearchQuery`.
    - `formatPopulation(population: number): string`: Formats population (e.g., "1.2M", "500K").

**Step 4: Update Data Filtering Logic**

1.  **Modify `fetchPageData` (and any related data fetching functions, e.g., for count)**:
    - Retrieve the `npaSet = new Set(metroAreaCodesToFilter.value);`.
    - If `npaSet.size > 0`, add a filter condition to the Dexie query (or client-side filter if Dexie doesn't handle it directly for the combination of filters):
      - `record => npaSet.has(record.npa)`
    - This condition must be ANDed with existing filters for `searchTerm` (NPANXX) and `selectedState`.
      - Example of combined filter logic: `currentFilters.push(record => npaSet.has(record.npa));` (assuming `currentFilters` is an array of filter functions that are all applied).
    - Ensure `totalFilteredItems` calculation also incorporates this metro filter condition.
2.  **Watcher for `selectedMetros`**:
    - `watch(selectedMetros, async () => { await resetPaginationAndLoad(); // Or your primary data refresh function }, { deep: true });`
    - This triggers a data reload and average recalculation when metro selections change.

**Step 5: Update Average Calculation Logic**

1.  **Modify `calculateFullFilteredAverages` Function**:
    - When fetching or iterating through data to calculate averages, apply the same metro filter logic as in `fetchPageData`.
    - Retrieve `npaSet = new Set(metroAreaCodesToFilter.value);`.
    - If `npaSet.size > 0`, ensure only records where `npaSet.has(record.npa)` are included in the average calculation, in addition to other active filters.

**Step 6: Update CSV Export Logic**

1.  **Modify `downloadCsv` Function**:
    - When fetching `allFilteredData` for CSV export, apply the same metro filter logic as in `fetchPageData`.
    - Retrieve `npaSet = new Set(metroAreaCodesToFilter.value);`.
    - If `npaSet.size > 0`, ensure the query fetching data for export includes the condition `record => npaSet.has(record.npa)`, ANDed with other active filters.

**Step 7: Enhance UI/UX and Other Considerations**

1.  **Update `handleClearAllFilters` (if it exists, or create one)**:
    - In addition to clearing `searchTerm` and `selectedState`, this function must also call `clearAllSelectedMetros()` (which clears `selectedMetros` and `metroSearchQuery`).
2.  **Loading States**: Ensure existing loading indicators (`isFiltering`, `isPageLoading`) are appropriately used during data re-fetch triggered by metro filter changes.
3.  **Intersection Behavior with State Filter**: The AND logic naturally handles this. If "New York Metro" (NPAs: 201, 212, 917 from NY; 203 from CT; 201, 973 from NJ) is selected, and then the State filter for "NJ" is applied, only records with `record.npa` in `{201, 973}` AND `record.stateCode === 'NJ'` will be shown.

---

## User-Confirmed Guidelines (Incorporated into the plan above):

- **Filter Combination**: Metro, State, and NPANXX filters should be combined for intersection. If a user-entered NPANXX (from search) or a selected state contains NPAs not present in the selected metro areas, no data should be shown for those out-of-scope NPAs. This is achieved by applying all filter conditions using AND logic.
- **Dropdown Population Display**: The metro filter dropdown should display the population for each metro area.
- **NPA Matching**: The filter will match the `npa` field of `USPricingComparisonRecord` against the `areaCodes` (which are NPAs) from the `metroAreaOptions`.
- **Multi-Select Metros**: Multi-select for metro areas is required. The NPAs from all selected metro areas will be aggregated for the filter query.
- **Targeted NPAs Display**: It's essential to show the user which NPAs are associated with their current metro area selections (similar to `USRateSheetTable.vue`).
- **UI/UX Consistency**: The metro filter in `USDetailedComparisonTable.vue` should function and look the same as in `USRateSheetTable.vue`.
- **State/Metro Intersection Example**: If "New York Metro" is selected (spanning NY, NJ, CT NPAs) and the user then filters by State "NJ", the table should only show records matching NPAs from the New York Metro _that are also in NJ_ and match any NPANXX search terms.

This revised plan should provide a clear path for implementation. I have no further questions at this time based on your feedback. I am ready to proceed with generating the code changes for `USDetailedComparisonTable.vue` according to this plan.

---

## Phase 3: Refactor Metro Filter into a Reusable Composable

This phase focuses on extracting the common metro filter logic and UI state management into a dedicated Vue composable (`useMetroFilter.ts`) to reduce code duplication and improve maintainability in `USRateSheetTable.vue` and `USDetailedComparisonTable.vue`.

### Step-by-Step Implementation Plan for `useMetroFilter.ts` and Integration

**Step 1: Create the `useMetroFilter.ts` Composable**

1.  **Create File**:
    - Create a new file: `client/src/composables/filters/useMetroFilter.ts`.
2.  **Import Dependencies**:
    - Import `ref`, `computed` from `vue`.
    - Import `metroAreaOptions`, `MetroAreaOption` from `client/src/types/constants/metro-population.ts`.
3.  **Define Composable Function `useMetroFilter`**:
    - This function will encapsulate all metro filter logic.
4.  **Reactive State Inside Composable**:
    - `const selectedMetros = ref<MetroAreaOption[]>([]);`
    - `const metroSearchQuery = ref('');`
5.  **Computed Properties Inside Composable**:
    - `metroButtonLabel`: Computes the text for the dropdown button based on `selectedMetros.value`. (e.g., "All Metro Areas", "New York Metro", "3 Metros Selected").
    - `filteredMetroOptions`: Filters `metroAreaOptions` based on `metroSearchQuery.value` (case-insensitive on `displayName`).
    - `totalSelectedPopulation`: Calculates `selectedMetros.value.reduce((sum, metro) => sum + metro.population, 0);`.
    - `targetedNPAsDisplay`: Generates an object `{ summary: string, fullList: string }` for NPAs from `selectedMetros.value.flatMap(metro => metro.areaCodes)`. Ensures uniqueness and sorting.
    - `areAllMetrosSelected`: Checks if all metros in `filteredMetroOptions.value` are present in `selectedMetros.value`.
    - `metroAreaCodesToFilter = computed<string[]>(() => [...new Set(selectedMetros.value.flatMap(metro => metro.areaCodes))]);` (This is the primary output for data filtering).
6.  **Helper Functions Inside Composable**:
    - `toggleMetroSelection(metro: MetroAreaOption)`: Adds/removes a metro from `selectedMetros`.
    - `isMetroSelected(metro: MetroAreaOption): boolean`: Checks if a metro is in `selectedMetros`.
    - `handleSelectAllMetros()`: Selects/deselects all metros currently visible in `filteredMetroOptions`. (Ensure this logic correctly adds to or removes from `selectedMetros` without overwriting unrelated selections if `filteredMetroOptions` is a subset of all options).
    - `removeSelectedMetro(metro: MetroAreaOption)`: Removes a metro from `selectedMetros` (typically used by chips).
    - `clearMetroSearch()`: Clears `metroSearchQuery`.
    - `clearAllSelectedMetros()`: Clears `selectedMetros.value = []` and `metroSearchQuery.value = ''`.
    - `formatPopulation(population: number): string`: Formats population (e.g., "1.2M", "500K").
7.  **Expose from Composable**:
    - Return all reactive state, computed properties, and helper functions that the parent components will need.
    ```typescript
    // Example structure for useMetroFilter.ts
    // export function useMetroFilter() {
    //   // ...state, computeds, functions...
    //   return {
    //     selectedMetros,
    //     metroSearchQuery,
    //     metroButtonLabel,
    //     filteredMetroOptions,
    //     totalSelectedPopulation,
    //     targetedNPAsDisplay,
    //     areAllMetrosSelected,
    //     metroAreaCodesToFilter,
    //     toggleMetroSelection,
    //     isMetroSelected,
    //     handleSelectAllMetros,
    //     removeSelectedMetro,
    //     clearMetroSearch,
    //     clearAllSelectedMetros,
    //     formatPopulation,
    //   };
    // }
    ```

**Step 2: Refactor `USRateSheetTable.vue` to use `useMetroFilter`**

1.  **Import Composable**:
    - In `<script setup lang="ts">`, import `useMetroFilter` from `client/src/composables/filters/useMetroFilter.ts`.
2.  **Instantiate Composable**:
    - `const { /* destructure all needed refs and functions */ } = useMetroFilter();`
3.  **Remove Duplicated Logic**:
    - Delete the local `selectedMetros`, `metroSearchQuery` refs.
    - Delete the local computed properties: `metroButtonLabel`, `filteredMetroOptions`, `totalSelectedPopulation`, `targetedNPAsDisplay`, `areAllMetrosSelected`.
    - Delete the local helper functions: `toggleMetroSelection`, `isMetroSelected`, `handleSelectAllMetros`, `removeSelectedMetro`, `clearMetroSearch`, `clearAllSelectedMetros`, `formatPopulation`.
    - The `metroAreaCodesToFilter` computed property will also be replaced by the one from the composable.
4.  **Update Template**:
    - Ensure the template binds correctly to the refs and methods provided by the composable. No structural changes to the metro filter UI elements themselves should be needed if names are kept consistent.
5.  **Update Data Filtering**:
    - In `fetchPageData` and `calculateAverages` (and any other data fetching/processing functions), ensure the filter logic now uses `metroAreaCodesToFilter.value` from the composable.
    - The watcher `watch(selectedMetros, ...)` should now watch `selectedMetros.value` from the composable.
6.  **Update "Clear All Filters"**:
    - Ensure `handleClearAllFilters` calls `clearAllSelectedMetros()` from the composable.

**Step 3: Implement Metro Filter in `USDetailedComparisonTable.vue` using `useMetroFilter`**

1.  **Import Composable**:
    - In `<script setup lang="ts">`, import `useMetroFilter` from `client/src/composables/filters/useMetroFilter.ts`.
    - Import `metroAreaOptions`, `MetroAreaOption` from `types/constants/metro-population.ts` (if not already, for type consistency if passing options to a sub-component later, though the composable handles `metroAreaOptions` internally).
    - Import necessary Headless UI components (`Menu`, `MenuButton`, etc.) and icons.
2.  **Instantiate Composable**:
    - `const { /* destructure all needed refs and functions */ } = useMetroFilter();`
3.  **Implement UI in `<template>` (as per Phase 2, Step 2, but using composable's state)**:
    - **Metro Filter Dropdown**: Bind `MenuButton` label to `metroButtonLabel` from composable. Use `metroSearchQuery` for the input. Iterate `filteredMetroOptions` for `MenuItem`s. Call `toggleMetroSelection`, `isMetroSelected`, `handleSelectAllMetros`, `clearAllSelectedMetros` from composable.
    - **Selected Metros Chips Display**: Iterate `selectedMetros` from composable. Call `removeSelectedMetro` from composable.
    - **Metro Filter Summary Section**: Use `selectedMetros.length`, `totalSelectedPopulation`, and `targetedNPAsDisplay` from composable.
4.  **Update Data Filtering Logic (as per Phase 2, Step 4)**:
    - Modify `fetchPageData` (and related functions like `calculateFullFilteredAverages`, `downloadCsv`) to use `metroAreaCodesToFilter.value` from the composable for filtering records by NPA.
5.  **Implement Watcher (as per Phase 2, Step 4.2)**:
    - `watch(selectedMetros, async () => { await resetPaginationAndLoad(); await calculateFullFilteredAverages(); }, { deep: true });` (watching `selectedMetros` from the composable).
6.  **Update "Clear All Filters" (as per Phase 2, Step 7.1)**:
    - Ensure the component's `handleClearAllFilters` (or equivalent) calls `clearAllSelectedMetros()` from the composable.

**Step 4: Testing**

1.  **Thoroughly test the Metro Filter in `USRateSheetTable.vue`**:
    - Single and multiple selections.
    - Search functionality within the dropdown.
    - Select/Deselect Visible.
    - Clear All Selected Metros.
    - Interaction with State and NPANXX filters (intersection logic).
    - Correct data loading and average recalculation.
    - CSV export with metro filter applied.
    - Rate adjustments with metro filter applied.
2.  **Thoroughly test the Metro Filter in `USDetailedComparisonTable.vue`**:
    - All functionalities listed above for `USRateSheetTable.vue`.
    - Correct display of selected metro chips and summary information.
    - Correct intersection with NPANXX and State filters.
    - Correct calculation of averages for `fullFilteredAverages`.
    - Correct CSV export with metro filter applied.
3.  **Ensure UI consistency** between the two tables for the metro filter components.
4.  **Verify no console errors** related to the composable or its integration.

This approach centralizes the metro filter's complex state and logic, making both parent components significantly cleaner and easier to maintain.

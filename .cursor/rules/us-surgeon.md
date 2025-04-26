# US Rate Sheet Feature Summary

This document summarizes the functionality provided by the `USRateSheetView.vue` and `USRateSheetTable.vue` components for managing US Rate Sheet data.

---

## Core Functionality

The US Rate Sheet feature allows users to upload, view, analyze, and manage US domestic rate sheet data.

### Data Upload & Processing (`USRateSheetView.vue`)

- **File Upload:** Users can upload US Rate Sheet data via CSV files using either drag-and-drop or a file selection dialog.
- **Preview & Mapping:** A preview modal (`PreviewModal.vue`) appears after file selection, showing the first few rows of the CSV.
  - Users map their CSV columns to required roles: NPANXX (or NPA + NXX), Interstate Rate, Intrastate Rate. Indeterminate Rate is optional.
  - Users specify the starting line number for data processing.
- **Processing:** Upon confirmation, the `usRateSheetService` processes the CSV:
  - Reads the data row by row.
  - Validates required fields.
  - Standardizes NPANXX format.
  - **Integrates LERG:** Uses the `lergStore` to look up the `stateCode` based on the NPA of each row. Rows with NPAs not found in LERG are marked invalid (though currently not displayed).
  - Stores valid, standardized data (`USRateSheetEntry`) into the `us_rate_sheet_db` DexieJS database in a table named `entries`. The `stateCode` derived from LERG is stored alongside the rate data.
- **Error Handling:** Displays errors related to file type, parsing, or processing.

### Data Display & Interaction (`USRateSheetView.vue` & `USRateSheetTable.vue`)

- **Dashboard Stats (`USRateSheetView.vue`):**
  - **Storage Status:** Indicates if US Rate Sheet data is present in Dexie.
  - **Total Records Processed:** Shows the count of records successfully processed from the last upload.
  - **Effective Date:** Displays the effective date found in the data (if any) and allows users to apply a new global effective date to all records via a date picker. The `usRateSheetService` handles updating all Dexie records.
- **Data Table (`USRateSheetTable.vue`):**
  - **Rate Averages:** Displays the average Interstate, Intrastate, and Indeterminate rates calculated across the dataset. These averages dynamically update based on the selected state/province filter, using an efficient hybrid caching strategy.
  - **Table Controls:** Provides tools to interact with the displayed data:
    - **NPANXX Search:** Filters the table based on partial NPANXX input (case-insensitive startswith search).
    - **State/Province Filter:** Filters the table based on a selected state or province. The dropdown is populated with unique `stateCode` values found in the Dexie data. (Refactored to use a custom, scrollable Headless UI Listbox for improved UX).
    - **Clear Data:** Allows users to permanently remove all US Rate Sheet data from the Dexie database.
    - **Export All:** Exports the _currently filtered_ data shown in the table to a new CSV file.
  - **Data Display:**
    - Shows paginated/infinitely scrolled rate sheet entries from Dexie.
    - Displays columns: NPANXX, State, Country, Interstate Rate, Intrastate Rate, Indeterminate Rate, Effective Date.
    - **LERG Integration:** Derives the display values for State and Country by looking up the NPA from the `lergStore`.
    - Uses efficient DexieJS queries for filtering and pagination.

---

## Next Steps: Rate Adjustment Feature

The next major feature to implement is allowing users to adjust the loaded rates.

- **Goal:** Enable users to select a subset of data (either "All" or a specific "State/Province" via the existing filter) and apply a percentage-based increase or decrease to the Interstate, Intrastate, and Indeterminate rates for that subset.

- **Implementation Plan:**
  1.  **UI Controls:**
      - Add input fields (likely within the `USRateSheetTable.vue` component, near the filters) for the user to enter a percentage value.
      - Add buttons for "Increase Rates" and "Decrease Rates".
  2.  **Adjustment Logic:**
      - Create a new method (likely in `usRateSheetService`) that accepts the filter criteria (`stateCode` or none for all) and the percentage adjustment.
      - This service method will query Dexie for the matching records.
      - It will iterate through the records (potentially using `modify` or batch updates for efficiency) and update the `interRate`, `intraRate`, and `ijRate` based on the percentage.
  3.  **Component Interaction:**
      - The "Increase/Decrease" buttons in `USRateSheetTable.vue` will trigger the new service method, passing the `selectedState.value` and the percentage input.
  4.  **Cache Invalidation:**
      - The rate adjustment logic (likely after the service call completes successfully) **must** invalidate the average rate caches in `USRateSheetTable.vue`:
        - `overallAverages.value = null;`
        - `stateAverageCache.value.clear();` (Or specifically delete the entry for the updated state if only one was updated).
      - This ensures the displayed averages are recalculated based on the new data when the filter changes.
  5.  **Data Refresh:** Trigger a reload/refresh of the visible table data (`resetPaginationAndLoad()`) to show the updated rates.
  6.  **Download Updated CSV:**
      - Add a new "Download Adjusted Rates" button (or modify the existing Export button's behavior/label when adjustments have been made).
      - This button will trigger a function to query the _updated_ data from Dexie (potentially applying the current filters) and generate a downloadable CSV file reflecting the adjusted rates.

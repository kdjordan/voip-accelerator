# Plan for Implementing Multi-NPA Filtering and Adjustment in USRateSheetTable.vue

The goal is to modify the `USRateSheetTable.vue` component to allow users to filter by multiple NPANXX values by entering them as a comma-separated list in the "Filter by NPANXX..." input field. The "Apply Rate Adjustments" feature must also correctly target records based on this multi-NPA filter.

## 1. Update NPANXX Input Processing

- **`searchQuery` (ref):** This will continue to hold the raw string input directly from the user's typing in the "Filter by NPANXX..." field.
- **`debouncedSearchQuery` (ref):**
  - Change this ref to store an `string[]` (array of strings) instead of a single `string`.
  - This array will hold the individual, trimmed, and lowercased NPANXX values extracted from `searchQuery`.
- **`debouncedSearch` Function (triggered by `watch(searchQuery, ...)`):**
  - Modify this function to process `searchQuery.value`:
    1.  Split the `searchQuery.value` string by commas (`,`).
    2.  For each resulting substring:
        - Trim leading/trailing whitespace.
        - Convert to lowercase.
    3.  Filter out any empty strings that might result from multiple commas (e.g., "201,,202") or an empty input.
    4.  Update `debouncedSearchQuery.value` with this new array of NPANXX strings.
- **Input Placeholder:**
  - Update the `placeholder` attribute of the NPANXX input field to guide users, for example: `"Filter by NPANXX (e.g., 201222, 301333)..."`.

## 2. Modify Data Fetching Logic (`fetchPageData`)

- **NPANXX Filtering:**
  - Locate the section where NPANXX filtering is applied:
    ```typescript
    if (debouncedSearchQuery.value) {
      // This condition will change
      query = query.filter(
        (record) =>
          record.npanxx.toLowerCase().startsWith(debouncedSearchQuery.value!) // This line will change
      );
    }
    ```
  - Update the logic:
    1.  The condition should check if `debouncedSearchQuery.value` (now an array) is not empty (`debouncedSearchQuery.value.length > 0`).
    2.  If the array is not empty, the filter should check if `record.npanxx.toLowerCase()` is _included_ in the `debouncedSearchQuery.value` array.
        - Example: `query = query.filter(record => debouncedSearchQuery.value.includes(record.npanxx.toLowerCase()));` (Note: Dexie's `.filter()` might behave differently with `.includes()` directly on an array of strings if it's not a simple value. A more robust approach for Dexie might be to use `.anyOfIgnoreCase(debouncedSearchQuery.value).on('npanxx')` if available and efficient, or fetch a broader set and filter client-side if necessary, though `filter(record => array.includes(record.field))` often works.)
        - Given the existing `.startsWith()`, it seems the NPANXX field is the full NPANXX. The requirement is to match exact NPANXXs from the list. So, `record.npanxx.toLowerCase().startsWith(singleQuery)` should become something like `debouncedSearchQuery.value.includes(record.npanxx.toLowerCase())`.
- **`hasComplexFilters` Logic:**
  - Review how `hasComplexFilters` is determined.
  - The `filtersAppliedCount` should now consider `debouncedSearchQuery.value.length > 0` as contributing to the filter count.
  - If filtering by multiple NPANXXs is deemed complex enough to disable database-level sorting, ensure this is correctly reflected.

## 3. Update Rate Adjustment Logic (`handleApplyAdjustment`)

- **NPANXX Filtering for Adjustments:**
  - Locate the NPANXX filtering section within `handleApplyAdjustment`:
    ```typescript
    if (debouncedSearchQuery.value) {
      // This condition will change
      collection = collection.filter(
        (record: USRateSheetEntry) =>
          record.npanxx.toLowerCase().startsWith(debouncedSearchQuery.value!) // This line will change
      );
      filtersApplied.push(`NPANXX starts with '${debouncedSearchQuery.value}'`); // This line will change
    }
    ```
  - Update this logic similarly to `fetchPageData`:
    1.  The condition should check if `debouncedSearchQuery.value.length > 0`.
    2.  If the array is not empty, filter the `collection` to include records where `record.npanxx.toLowerCase()` is present in the `debouncedSearchQuery.value` array.
  - **`filtersApplied` Message:**
    - Update the message pushed to `filtersApplied`. If multiple NPANXXs are used, the message should reflect this. For example: `filtersApplied.push(\`NPANXXs in [\${debouncedSearchQuery.value.join(', ')}]\`);`if`debouncedSearchQuery.value.length > 1`, or a singular message if only one NPA.

## 4. Update Filter Clearing Logic (`handleClearAllFilters`)

- **`searchQuery.value = '';`**: This existing line is correct.
- The watcher on `searchQuery` will automatically call `debouncedSearch`, which will then process the empty string and set `debouncedSearchQuery.value` to an empty array. No direct changes to `debouncedSearchQuery` are needed here.

## 5. UI Feedback for Multiple NPAs (Optional Enhancement)

- To improve user experience, consider displaying the parsed, individual NPANXX values as "chips" or tags below the input field, similar to how "Selected Metros" are displayed.
- This would provide users with clear visual confirmation of how their comma-separated input has been interpreted by the system.
- This is an optional enhancement and can be implemented as a follow-up.

## 6. Testing Strategy

- **Single NPANXX:** Ensure filtering and adjustments work as before with a single NPANXX.
- **Multiple NPANXXs:**
  - Test with valid, comma-separated NPANXXs (e.g., `"201222,301333,401444"`).
  - Test with spaces around commas and NPANXXs (e.g., `" 201222 , 301333 "`).
- **Input Variations:**
  - Empty input (should show all or respect other filters).
  - Input with only commas (e.g., `",,"`). Should result in no NPANXX filter.
  - NPANXXs that don't exist in the dataset.
- **Combined Filters:** Test multi-NPA filtering in conjunction with:
  - State/Province filter.
  - Metro Area filter.
- **Rate Adjustments:**
  - Verify that rate adjustments are applied _only_ to the records matching the provided multiple NPANXXs (and any other active filters).
- **Export Feature:**
  - Confirm that the "Export All" functionality correctly respects the multi-NPA filter.
- **Pagination and Counts:**
  - Ensure `totalFilteredItems`, pagination controls, and displayed data counts are accurate when multi-NPA filters are active.
- **Edge Cases:**
  - Very long list of NPANXXs.
  - Mix of valid and potentially invalid NPANXX formats in the input.
  - Case sensitivity (should be case-insensitive as per current logic).

This plan provides a comprehensive approach to implementing the multi-NPA filtering feature while ensuring existing functionalities remain robust.

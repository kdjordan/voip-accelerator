# Refactoring Plan: Effective Date - Display Only (Plan B)

**Goal:** Change the effective date handling for US Rate Sheets to only store and update a single global value (in Pinia store) and display that in the UI/exports, removing the need to update individual records in Dexie.

**Steps:**

1.  **Modify `us-rate-sheet-store.ts` (`client/src/stores/us-rate-sheet-store.ts`):**

    - **`updateEffectiveDate` Action:** Remove the call to `service.updateAllEffectiveDates()`. This action should now _only_ update `this.currentEffectiveDate = newDate` and potentially `this.lastDbUpdateTime` if other components need to react purely to the date _display_ change (unlikely needed for the table itself).
    - **`loadRateSheetData` Action:** Remove the call to `service.getCurrentEffectiveDate()`. The `currentEffectiveDate` should probably initialize to `null` or a sensible default (like today + 7 days) if no data exists, or be set during `handleUploadSuccess` based on a default rule (not fetched).
    - **`fetchCurrentEffectiveDate` Action:** Remove this action entirely.
    - **`isUpdatingEffectiveDate` State/Getter:** Remove this state property and related getter logic, as the update becomes synchronous.
    - **`handleUploadSuccess` Action:** Remove the call to `this.fetchCurrentEffectiveDate()`. Set `this.currentEffectiveDate` based on a default rule (e.g., 7 days from upload) upon successful upload.

2.  **Modify `USRateSheetService.ts` (`client/src/services/us-rate-sheet.service.ts`):**

    - Remove the entire `updateAllEffectiveDates` function.
    - Remove the entire `getCurrentEffectiveDate` function.
    - In `processRow`, remove the `effectiveDate` parameter and stop assigning `effectiveDate` to the returned `USRateSheetEntry` object.
    - Update the call signature in `processFile` where `processRow` is called.

3.  **Modify Types (`client/src/types/domains/rate-sheet-types.ts`):**

    - In the `USRateSheetEntry` interface, remove the `effectiveDate?: string;` property.

4.  **Modify Dexie Setup (`client/src/composables/useDexieDB.ts` - _If Applicable_):**

    - If the schema for the `us_rate_sheet_db`'s `entries` table is explicitly defined with `effectiveDate`, remove it from the schema string (e.g., `++id, npanxx, stateCode, effectiveDate` -> `++id, npanxx, stateCode`). If the schema is implicit (just `++id`), no change is needed here.

5.  **Modify `USRateSheetView.vue` (`client/src/pages/USRateSheetView.vue`):**

    - Verify `handleApplyEffectiveDate` now _only_ calls `store.updateEffectiveDate(selectedEffectiveDate.value)`.
    - Remove any bindings or logic related to `store.isUpdatingEffectiveDate`.

6.  **Modify `USRateSheetTable.vue` (`client/src/components/rate-sheet/us/USRateSheetTable.vue`):**

    - **Template Update:** In the `<tbody>`, find the `<td>` for the Effective Date column. Change its content from `{{ entry.effectiveDate || 'N/A' }}` to `{{ store.getCurrentEffectiveDate || 'N/A' }}`.
    - **`stopDbUpdateWatcher`:** Remove this watcher entirely, as the table data no longer needs to react to effective date changes.
    - **`handleExport` Function:** Inside the `dataToExport.map()` logic, change the assignment for `effectiveDate` from `entry.effectiveDate || 'N/A'` to `store.getCurrentEffectiveDate || 'N/A'`.

7.  **Review & Test:**
    - Clear application storage (IndexedDB) for a clean test.
    - Upload a US Rate Sheet CSV.
    - Verify the initial effective date is set correctly in the UI (input and table).
    - Change the effective date using the input and click Apply.
    - Verify the date updates instantly in the table header input and _all_ rows of the table display.
    - Verify the export function uses the _currently selected_ effective date.
    - Check console for any errors.

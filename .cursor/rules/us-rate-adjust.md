# US Rate Sheet Rate Adjustment Implementation Plan

This plan outlines the steps to add functionality for marking up or down rates (Interstate, Intrastate, Indeterminate, or All) based on the currently applied filters in `USRateSheetTable.vue` and persisting these changes to the DexieDB `us_rate_sheet_db`.

**Status:** Implementation complete. Testing pending.

## 1. UI Implementation (`USRateSheetTable.vue`) - ✅ COMPLETE

- **Create New Section:** Added `div` below Filters/Actions row.
- **Add Title:** Added heading "Apply Rate Adjustments (to Filtered Results)".
- **Input Fields & Controls:**
  - **Adjustment Type:** Added `Listbox` for "Markup" / "Markdown".
  - **Value Type:** Added `Listbox` for "Percentage (%)" / "Fixed Amount ($)".
  - **Value Input:** Added `number` input.
  - **Target Rate Type:** Added `Listbox` for "All Rates", "Interstate", "Intrastate", "Indeterminate".
  - **Apply Button:** Added `BaseButton` (primary variant, icon, text).
- **Feedback Area:** Added area for loading/status/error messages.

## 2. Logic Implementation (`USRateSheetTable.vue` - `<script setup>`) - ✅ COMPLETE

- **State Management:** ✅ Added `ref`s for adjustment parameters, loading state, and messages.
- **`applyRateAdjustments` Function:**
  - ✅ Implemented function structure (validation, key fetching, calculation logic, refresh calls).
  - ✅ Resolved Dexie `InvalidStateError` by switching from individual updates in a transaction loop to using `bulkUpdate`.
  - ✅ Status/error feedback implemented.
  - ✅ Refresh logic (`resetPaginationAndLoad`, `calculateAverages`) implemented.
- **Imports:** ✅ Added `Listbox` components, icons, and necessary types.

## 3. Type Safety (`types/`) - ✅ COMPLETE

- Defined types (`AdjustmentType`, `AdjustmentValueType`, `TargetRateType`, `RateAdjustmentSettings`) in `client/src/types/domains/rate-sheet-types.ts`.

## 4. DexieDB (`useDexieDB.ts` / `USRateSheetTable.vue`) - ✅ REVIEWED

- **Indexing:** Confirmed `npanxx` and `stateCode` are correctly indexed in the schema.
- **Connection:** Existing DB connection handling seems adequate.

## 5. Store Interaction (`us-rate-sheet-store.ts`) - ✅ REVIEWED & UPDATED

- **Refresh:** Confirmed component refresh logic (`resetPaginationAndLoad`, `calculateAverages`) is in place.
- **Signaling:** ✅ Added `store.lastDbUpdateTime = Date.now();` after successful adjustment for explicit signaling.

## 6. Testing - ⏳ READY FOR TESTING

- Test various combinations of filters and adjustments.
- Verify data persistence after refresh.
- Test edge cases (zero value, no matching records).

---

**Next Steps (New Chat):** Focus on resolving the Dexie `InvalidStateError`. Potential strategies include:

- Further reducing the scope/duration of the write transaction.
- Investigating alternative Dexie update patterns for large datasets.
- Checking for potential interactions with other async operations in the component.
- Exploring Dexie-specific error handling or transaction lifecycle management techniques.

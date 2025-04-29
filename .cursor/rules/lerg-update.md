# Plan: Add Single LERG Record Functionality

This document outlines the steps to add functionality for adding individual LERG records via the Admin Dashboard.

**Revised based on user feedback regarding sync strategy.**

## 1. Backend (Supabase Edge Function)

- **Create Function:** Develop a new Supabase Edge Function named `add-lerg-record` in `supabase/functions/`.
- **Input:** Accept `POST` requests with a JSON body containing `npa` (string), `state` (string), `country` (string).
- **Validation:** Implement robust validation for the incoming data payload (required fields, data types, formats - e.g., NPA format).
- **Database Interaction:**
  - Connect to the Supabase database.
  - Construct an `INSERT INTO lerg (npa, state, country) VALUES ($1, $2, $3)` query.
  - Handle potential database errors, especially the unique constraint violation on `npa`.
- **Output:**
  - On success: Return `201 Created` status.
  - On validation error: Return `400 Bad Request` with details.
  - On duplicate `npa`: Return `409 Conflict` with details.
  - On other DB errors: Return `500 Internal Server Error` with details.

## 2. Frontend Service (`client/src/services/lerg.service.ts`)

- **Add Method:** Implement `addSingleRecord(record: Pick<LERGRecord, 'npa' | 'state' | 'country'>): Promise<void>` in `LergService`.
- **Invoke Function:** Use `supabase.functions.invoke('add-lerg-record', { body: record })` to call the Edge Function.
- **Error Handling:** Catch errors from the function invocation (especially 400, 409, 500 status codes) and re-throw them as appropriate `LergDataError`, `LergConflictError` (new?), or similar service errors.
- **Local Update:** **REMOVED.** No direct local update needed.
- **Cache Invalidation:** **REMOVED.** Handled by the subsequent full sync.

## 3. Frontend Composables (`client/src/composables/useLergData.ts`)

- **Review Existing Sync:** Identify the function responsible for the full data sync (e.g., `initializeLergData`, `downloadLerg`, or a similar function that clears local and fetches from Supabase). Let's assume it's `initializeLergData` for now.
- **Expose Add Functionality:** Add a new function, e.g., `addAndRefreshLergRecord(record: Pick<LERGRecord, 'npa' | 'state' | 'country'>): Promise<void>`.
  - This function will:
    - Call `LergService.getInstance().addSingleRecord(record)`.
    - Upon success, call the existing full sync function (e.g., `initializeLergData()`).
    - Handle errors from both steps, update loading/error states exposed by the composable.

## 4. Frontend Store (`client/src/stores/lerg-store.ts`)

- **No Action Needed:** **REMOVED.** The composable (`useLergData`) will handle the interaction with the service and trigger the refresh, which updates the store.

## 5. Frontend Component (`client/src/pages/AdminView.vue`)

- **UI Section:** Add a dedicated form section for "Add LERG Record".
- **Form Inputs:** Create input fields for `npa`, `state`, `country`. Use dropdowns populated from constants.
- **Validation:** Implement client-side form validation.
- **Composable Usage:** Import and use `useLergData`.
- **Submission Logic:**
  - On submit, construct the record object (`{ npa, state, country }`).
  - Call the new composable function: `await addAndRefreshLergRecord(newRecord)`. Access loading/error states from the composable for UI feedback.
  - Display loading state and success/error feedback messages.
  - Clear the form on successful addition.

## 6. Types (`client/src/types/domains/lerg-types.ts`)

- **Review `LERGRecord`:** Ensure the interface reflects the Supabase schema (`id?: number`, `npa: string`, `state: string`, `country: string`, `last_updated?: string | Date`). Define input type specifically for the add operation if needed: `type AddLergRecordInput = Pick<LERGRecord, 'npa' | 'state' | 'country'>;`

## Revised Flow Summary

1.  User fills form in `AdminView.vue` and submits.
2.  `AdminView.vue` calls `addAndRefreshLergRecord` from `useLergData.ts`.
3.  `useLergData.ts` calls `lergService.addSingleRecord`.
4.  `lergService.ts` calls the `add-lerg-record` Supabase Edge Function.
5.  Edge Function inserts into the Supabase DB.
6.  If successful, `useLergData.ts` calls `initializeLergData` (or the equivalent sync function).
7.  `initializeLergData` clears local IndexedDB, fetches all data from Supabase (likely via `get-lerg-data` Edge Function or direct DB query), populates local IndexedDB, processes data, and updates the `lerg-store`.
8.  UI updates reactively based on store changes and composable state (loading/error).

## Open Questions & Considerations

- **Supabase Schema:** Need the exact schema (columns, types, constraints) of the Supabase LERG table.
- **Mandatory Fields:** Confirm the minimum required fields for a valid LERG record insertion.
- **Duplicate Handling:** Define the expected behavior and error reporting when attempting to add a duplicate record (e.g., existing NPA).
- **Sync Strategy:** Confirm the Supabase-first, then local IndexedDB update flow. Consider potential inconsistencies if the local update fails after a successful Supabase insert.

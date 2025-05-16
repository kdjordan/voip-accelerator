# Step-by-Step Plan: Implement User Account Deletion in Supabase

**Overall Status:** Core implementation (Steps 1-6) complete. Steps 7-9 (Security, Testing, Documentation) are ongoing or future considerations.

This document outlines the steps required to implement the ability for a user to delete their own account within the VoIP Accelerator application, leveraging Supabase for backend operations.

## 1. Frontend UI (Vue Component) - ✅ DONE

- **Objective:** Provide a user-facing control to initiate the account deletion process.
- **Implementation Notes:**
  - "Delete Account" button added to `client/src/pages/DashBoard.vue` within the "Account Settings" section.
  - Styled with `variant="destructive"` using Tailwind CSS as defined in `tailwind.config.js`.
  - Visibility is implicitly handled by the page being accessible only to authenticated users.
  - Loading state (`isDeletingAccount`) added to the button.
  - Error messages (`deleteAccountError`) displayed below the button.

## 2. Confirmation Modal (Vue Component) - ✅ DONE

- **Objective:** Prevent accidental deletions by requiring explicit user confirmation.
- **Implementation Notes:**
  - Reusable modal component created at `client/src/components/shared/ConfirmationModal.vue`.
  - Triggered by the "Delete Account" button in `DashBoard.vue`.
  - Modal displays title, warning message, and requires typing "DELETE" for confirmation.
  - Includes "Cancel" and "Yes, Delete My Account" (confirm) buttons.
  - Integrated into `DashBoard.vue` with `v-model="showDeleteConfirmModal"`.

## 3. Supabase Edge Function (`delete-user-account`) - ✅ DONE (Refined)

- **Objective:** Securely handle the account deletion logic on the backend.
- **Implementation Notes:**
  - Edge Function created at `supabase/functions/delete-user-account/index.ts`.
  - Uses `serve` from `https://deno.land/std@0.177.0/http/server.ts` and `createClient` from `@supabase/supabase-js` (matching project patterns).
  - Retrieves `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `Deno.env`.
  - Handles CORS directly within the function.
  - Extracts JWT from `Authorization` header to get the user.
  - Uses `supabaseAdminClient.auth.admin.deleteUser(userIdToDelete)` to delete the user from `auth.users`.
  - Includes placeholders and comments for deleting related data from other tables (manual or cascade).
  - Returns appropriate JSON responses for success or error.

## 4. Frontend Service/API Call (Pinia Store or Composable) - ✅ DONE

- **Objective:** Trigger the Edge Function from the Vue application.
- **Implementation Notes:**
  - `deleteCurrentUserAccount` async action added to `client/src/stores/user-store.ts`.
  - Invokes the `delete-user-account` Supabase Edge Function using `supabase.functions.invoke()`.
  - Handles loading states (`setGlobalLoading`) and error states.
  - On successful function invocation, calls `this.signOut()` to clear local session.

## 5. Post-Deletion Flow (Frontend) - ✅ DONE

- **Objective:** Handle the application state after successful or failed deletion.
- **Implementation Notes (in `client/src/pages/DashBoard.vue`'s `handleDeleteAccountConfirm` function):**
  - **On Success:**
    - User is signed out via `userStore.signOut()`.
    - User is redirected to the 'Login' route (`router.push({ name: 'Login' })`).
    - Success message logged; UI can be enhanced with toasts.
  - **On Failure:**
    - Error message is stored in `deleteAccountError` and displayed below the delete button.
    - Modal is closed (can be adjusted to stay open with error).

## 6. Error Handling and User Feedback - ✅ DONE (Basic Implementation)

- **Objective:** Provide a robust and user-friendly experience.
- **Implementation Notes:**
  - Loading state (`isDeletingAccount`) on the "Delete My Account" button in `DashBoard.vue`.
  - Error messages (`deleteAccountError`) displayed directly in `DashBoard.vue`.
  - `user-store.ts` and Edge Function include `try-catch` blocks and console logging for errors.
  - User-facing error messages are provided, though more sophisticated global toast/notification system could enhance this.

## 7. Security Considerations - ⚠️ PENDING REVIEW/ACTIONS

- **Service Role Key:** Ensure `SUPABASE_SERVICE_ROLE_KEY` is securely stored as an environment variable in your Supabase project settings for the deployed function and NOT exposed client-side.
- **Authorization in Edge Function:** The function derives `userId` from the JWT in the `Authorization` header, which is the correct approach.
- **CORS:** Configured in the Edge Function. Review `'Access-Control-Allow-Origin': '*'` for production; restrict to your frontend domain if possible.
- **Input Validation:** The confirmation phrase provides a basic check. Further server-side validation is minimal as the action is tied to the authenticated user.
- **Data Deletion Scope:** Carefully review and implement logic for deleting all related user data in the Edge Function (Step 3, commented-out section) if not fully handled by `ON DELETE CASCADE` in your database schema. Incomplete deletion can lead to orphaned data or privacy issues.

## 8. Testing - ⚠️ PENDING

- **Objective:** Ensure the feature works correctly and securely.
- **Actions Needed:**
  - **Edge Function:** Test locally (`supabase functions serve`) and after deployment.
  - **Frontend:**
    - Test UI flow: button, modal, confirmation.
    - Test API call, loading states, error display, success redirection.
  - **End-to-End (E2E):**
    - Create a test user.
    - Log in.
    - Attempt deletion, cancel.
    - Attempt deletion, confirm with incorrect phrase.
    - Attempt deletion, confirm with correct phrase.
    - Verify:
      - User is logged out.
      - User cannot log in again.
      - All associated data in the database (auth table, profiles, other related tables) is confirmed deleted.
      - User is redirected correctly.
    - Test error scenarios (e.g., network failure, Edge Function throwing an error).

## 9. Documentation - ⚠️ PENDING

- **Objective:** Keep project documentation up-to-date.
- **Actions Needed:**
  - Update user-facing FAQs or help guides regarding account deletion.
  - Add internal documentation for the `delete-user-account` Edge Function: its purpose, data deletion strategy, and environment variable dependencies.
  - Update schema documentation if `ON DELETE CASCADE` rules are added/modified, or if manual data deletion steps are critical.

This detailed plan should guide the implementation of the user account deletion feature.

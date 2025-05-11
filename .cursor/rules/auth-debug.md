## Auth Redirection Debug Summary & Next Steps

**Goal:** Ensure users with a valid session (token in local storage) are automatically redirected to the `/dashboard` when they open the app or after email confirmation, without being shown the login page.

**Original Problem:** The navigation guard in `router/index.ts` was making its decision before the `user-store`'s `initializeAuthListener` had fully completed, specifically before `isInitialized` was reliably set after profile fetching. This led to users with valid sessions sometimes seeing the `HomeView` instead of being redirected to `/dashboard`.

**Progress & Fixes Implemented:**

1.  **Refactored `user-store.ts` -> `initializeAuthListener`:**

    - The `initializeAuthListener` function was significantly refactored to ensure `this.auth.isInitialized = true` and `this.auth.isLoading = false` are set reliably in a `finally` block of the main promise.
    - Logic was clarified to make `supabase.auth.getSession()` the primary driver for the initial authentication state and profile fetch.
    - `onAuthStateChange` is now primarily for handling ongoing auth events after initial load.
    - Detailed logging was added throughout this function.

2.  **Global Loading State in `App.vue`:**

    - `App.vue` now uses a `v-if="!userStore.getAuthIsInitialized"` to display a global "Loading Application..." message.
    - The `<RouterView />` is only rendered _after_ `userStore.getAuthIsInitialized` becomes `true`.
    - This was intended to ensure router guards run only when the auth store is in a definitive state.

3.  **`watchEffect` for Redirection in `App.vue`:**

    - A `watchEffect` was added to `App.vue` to monitor `userStore.getAuthIsInitialized` and `userStore.getIsAuthenticated`.
    - If both are true and the user is on a transitional route (like `/` or `/login`), it programmatically calls `router.push({ name: 'dashboard' })`.
    - This was further refined to use `await nextTick()` before `router.push` to prevent rendering hangs.

4.  **Timeout for `fetchProfile` in `user-store.ts`:**
    - A 10-second timeout using `AbortController` was added to the `fetchProfile` action.
    - If the Supabase query to fetch the profile hangs, it's aborted, an error is set in the store (`this.auth.error`), and `this.auth.isLoading` within `fetchProfile` is correctly set to `false`.
    - Logic was added in `initializeAuthListener` to attempt `supabase.auth.signOut()` if `fetchProfile` fails for an authenticated user (e.g., due to timeout).
    - This sign-out attempt was wrapped in a `try...catch`.

**Current Status & Remaining Issue:**

- **Most Auth Flows Work:** Sign-up, sign-in, sign-out, and email confirmation flows appear to be functioning correctly, redirecting users to `/dashboard` as expected.
- **Hard Refresh Works:** If a user has a valid session and does a hard refresh on any page, the authentication is correctly detected, and they are either on the dashboard or redirected there if on a transitional route.

- **Remaining Problem: "Fresh Tab" Hang**
  - When a user has a valid session (token in local storage), closes the browser tab, and then opens a new tab navigating directly to the root URL (`/`, which loads `HomeView`):
    - The application hangs on the "Loading Application..." screen.
    - Console logs show that `fetchProfile` is called from `initializeAuthListener`.
    - The Supabase call `supabase.from('profiles').select(...).single()` within `fetchProfile` times out after 10 seconds (as per the `AbortController` logic). The `AbortError` is caught within `fetchProfile`, and its `finally` block correctly logs that `isLoading` (local to `fetchProfile`'s scope) is set to `false`.
    - **Crucially, the execution within `initializeAuthListener`'s `getSession().then(...)` block does not proceed past the `await this.fetchProfile(...)` line.** Subsequent logs, including those for the sign-out attempt or for resolving the main `initializeAuthListener` promise, are not reached.
    - Because the main promise in `initializeAuthListener` never resolves (or rejects), its `finally` block never runs.
    - This leaves `userStore.auth.isInitialized` as `false` and `userStore.auth.isLoading` as `true` (from the start of `initializeAuthListener`).
    - As a result, `App.vue` remains stuck showing the loading overlay.

**Hypothesis for Remaining Issue:**

Even though `fetchProfile` catches the `AbortError` and its `finally` block executes, the `await this.fetchProfile()` call in `initializeAuthListener` is not resolving or rejecting in a way that allows the `async` function `initializeAuthListener` (specifically the `getSession().then()` callback) to continue its execution. This might be due to how JavaScript's event loop or promise resolution handles an `await` on a function that internally manages an aborted asynchronous operation via `AbortSignal`.

**Next Steps for New Chat Session:**

1.  **Diagnose `await fetchProfile()` behavior:** Determine why `initializeAuthListener`'s `getSession().then()` block stalls after `await fetchProfile()` returns (post-timeout). This might involve temporarily simplifying the logic immediately following this `await` to isolate the problem.
2.  **Ensure `initializeAuthListener` Promise Settles:** Regardless of `fetchProfile`'s outcome (even a timeout), the main promise returned by `initializeAuthListener` _must_ eventually resolve or reject so that its `finally` block runs, `isInitialized` becomes `true`, and the UI unblocks.
3.  **Re-evaluate Supabase Client Interaction:** If the issue points to a fundamental problem with how the Supabase client call behaves after an abort, consider alternative ways to handle this specific data fetch or explore Supabase community channels for similar issues with the specific client version used.

### UX Refinements & Revised Next Steps (as of last session)

**Goal (Revised UX):**

- Upon initial load (e.g., fresh tab to `/`), the `HomeView` should render immediately.
- If the authentication state is not yet determined (`userStore.auth.isInitialized` is `false`), a toast notification "Attempting to log you in..." (with a spinner) will appear overlaid on `HomeView`.
- Once `userStore.auth.isInitialized` becomes `true`:
  - The toast will disappear.
  - If the user is authenticated, they will be redirected to `/dashboard`.
  - If not authenticated, they will remain on `HomeView`.
- The previous full-screen "Loading Application..." overlay has been removed in favor of this toast-based approach.

**Key Observations & Remaining Issues from Previous Session:**

- An initial "black screen" persists before `HomeView` renders. This is because the main application content in `App.vue` is wrapped in a `<template v-if="userStore.getAuthIsInitialized">`. This `v-if` blocks rendering until `userStore.initializeAuthListener()` completes and sets `isInitialized = true`.
- The `onMounted` hook in `App.vue` currently `await`s several asynchronous operations (`clearApplicationDatabases`, store resets, and `userStore.initializeAuthListener()`), contributing to the delay in `isInitialized` becoming `true`.
- The core "Fresh Tab Hang" issue (where `initializeAuthListener` stalls after a `fetchProfile` timeout, preventing `isInitialized` from being set) remains the primary blocker for reliable authentication flow.

**Next Steps (Planned for New Chat Session):**

1.  **Optimize `App.vue` `onMounted` for Immediate Rendering:**

    - Modify `App.vue`'s `onMounted` hook to make the initial setup tasks (`clearApplicationDatabases`, `azStore.resetFiles`, `usStore.resetFiles`) non-blocking (i.e., do not `await` them; let them run in the background).
    - The call to `userStore.initializeAuthListener()` from `App.vue` should also be non-blocking to prevent `App.vue` from being held up by it.

2.  **Ensure `HomeView.vue` is Statically Imported:**

    - Verify and ensure `HomeView.vue` is statically imported in `client/src/router/index.ts` (`import HomeView from '@/pages/HomeView.vue';` and `component: HomeView`). This is critical to eliminate delays in its code being available.

3.  **Crucially: Make `userStore.initializeAuthListener()` Robust:**

    - **Highest Priority.** Refactor `userStore.initializeAuthListener()` in `user-store.ts` to _absolutely ensure_ its main promise always settles and its `finally` block (which sets `this.auth.isInitialized = true` and `this.auth.isLoading = false`) executes, regardless of whether `fetchProfile` succeeds, fails, or times out. This is essential for the toast to disappear and for the `v-if="userStore.getAuthIsInitialized"` in `App.vue` to reveal the page content.

4.  **Address `fetchProfile` Timeout Handling within `initializeAuthListener`:**
    - Investigate and fix why the execution within `initializeAuthListener`'s `getSession().then(...)` block stalls after `await this.fetchProfile(...)` when a timeout occurs. Ensure that even if `fetchProfile` is aborted or fails, `initializeAuthListener` continues its logic (e.g., attempting sign-out if appropriate, and most importantly, resolving/rejecting its main promise).

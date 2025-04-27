# Plan: Prevent Eager IndexedDB Creation on Startup

1.  **Goal:**

    - Stop IndexedDB databases (like `us_rate_deck_db`, `az_rate_deck_db`, `rate_sheet_db`, `*_comparison_db`, etc.) from being automatically recreated immediately after the startup cleanup (`clearApplicationDatabases`) deletes them.
    - Ensure these databases are only created/opened when actively needed for a specific operation (e.g., storing uploaded file data, generating comparison results).

2.  **Problem:**

    - The `clearApplicationDatabases` function in `client/src/utils/cleanup.ts` successfully deletes databases on application mount (`App.vue`'s `onMounted`).
    - However, initialization code running shortly after calls the `useDexieDB().getDB()` composable function.
    - The `getDB` function in `client/src/composables/useDexieDB.ts` contains logic (`db = new Dexie(dbName); ... await db.open();`) that creates and opens the database if it doesn't find an existing connection. This implicitly recreates the just-deleted databases.

3.  **Strategy:**

    - Adopt a **lazy initialization** pattern for database connections.
    - Refactor the codebase to ensure `useDexieDB().getDB()` is _only_ called within functions or actions that perform explicit database read/write operations, not during the general setup/initialization phase of stores or components.

4.  **Execution Steps:**

    - **Identify Eager `getDB` Calls:**
      - Search the codebase (specifically stores and components) for calls to `useDexieDB().getDB()`.
      - Pay close attention to calls made directly within `defineStore` setup blocks, component `<script setup>` top-level scope, or `onMounted` hooks _before_ a specific data operation is initiated.
    - **Refactor Pinia Stores:**
      - Examine stores like `us-store.ts`, `az-store.ts`, `us-rate-sheet-store.ts`, `az-rate-sheet-store.ts`, and potentially others.
      - Remove any `getDB()` calls from the initial store setup logic.
      - Move `getDB()` calls _inside_ the specific actions that require database access (e.g., an action that processes an uploaded file, an action that saves comparison results, an action that loads data for display).
    - **Refactor Components:**
      - Review Vue components involved in uploading files, triggering analyses, or displaying data from these databases.
      - Remove any `getDB()` calls made during component `setup` or `onMounted` purely for initialization.
      - Ensure `getDB()` is invoked only within methods/functions triggered by user interaction (e.g., `@click` handler) or specific data-fetching logic (e.g., inside a function called to load report data).
    - **Review Composables/Utils:**
      - Check if any other utility functions or composables might be calling `getDB` eagerly during application startup.
    - **Testing and Verification:**
      - After refactoring, refresh the application multiple times.
      - Use browser dev tools to inspect IndexedDB storage. Databases deleted by `clearApplicationDatabases` should _not_ reappear immediately.
      - Monitor console logs. Confirm that `clearApplicationDatabases` runs successfully, and that `[useDexieDB] No active connection... Creating new instance.` logs only appear when a specific data operation legitimately requires database creation/access for the first time.

5.  **Potential Files for Review:**
    - `client/src/stores/*.ts` (all store files, focusing on those related to rate decks, rate sheets, comparisons)
    - `client/src/composables/useDexieDB.ts` (understand its usage patterns)
    - `client/src/components/**` (components related to file uploads, data tables, reports)
    - `client/src/services/*.ts` (if any services perform initialization involving DB access)

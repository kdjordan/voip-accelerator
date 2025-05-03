# VoIP Accelerator: Technical Overview

**Document Purpose:** To provide a technical summary of the VoIP Accelerator application's features, architecture, technology stack, and data pipelines for internal stakeholders (engineering, product).

---

## 1. Core Architecture & Philosophy

- **Local-First:** The primary architectural principle is "local-first". Most data storage (rate decks, comparisons) and processing occur client-side within the user's browser to maximize performance, responsiveness, and enable offline capabilities.
- **Client:** Modern single-page application (SPA).
  - **Framework:** Vue 3 (Composition API with `<script setup>` style mandated).
  - **Language:** TypeScript (strict typing, interfaces preferred over types, no enums).
  - **Build Tool:** Vite (enabling fast HMR, optimized builds, code splitting).
  - **Styling:** Tailwind CSS (utility-first, leveraging a custom theme).
  - **State Management:** Pinia (modular stores per feature, e.g., `azStore`, `usStore`).
  - **Routing:** Vue Router.
  - **Local Database:** IndexedDB, managed via Dexie.js wrapper (`useDexieDB` composable).
  - **Async Utilities:** VueUse.
  - **Client-Side Processing:** Web Workers are used for computationally intensive tasks (comparisons, analysis) to avoid blocking the main thread.
- **Backend/Cloud:** Supabase provides backend services.
  - **Database:** Supabase PostgreSQL (primarily for LERG data, user authentication, potentially future cloud sync features).
  - **Authentication:** Supabase Auth.
  - **Serverless Functions:** Supabase Edge Functions (Deno runtime) for specific backend operations (e.g., `add-lerg-record`, `get-lerg-data`).
- **Code Structure:** Monorepo (implied), with clear separation likely between `client/` and `supabase/`. Client follows standard Vue/Vite structure (`src/components`, `src/composables`, `src/stores`, `src/services`, `src/types`, `src/pages`).

---

## 2. Key Features & Technical Implementation

**2.1. Data Upload & Processing (AZ/US/Rate Sheets)**

- **Trigger:** User drag-and-drops or selects a CSV file onto designated drop zones (e.g., `az1`, `az2` for AZ comparison).
- **Frontend:**
  - Vue components handle file input (`<input type="file">`, drag/drop listeners).
  - **Column Mapping:** A modal (`PreviewModal`?) appears, allowing users to map CSV columns to predefined application fields.
  - **Parsing:** PapaParse library likely used for client-side CSV parsing.
  - **Standardization:** Logic (likely within a service like `az-rate-sheet.service.ts`) standardizes data based on mapping.
  - **Storage:** Standardized records are bulk-inserted into IndexedDB using `useDexieDB`.
    - **Database:** Specific DB per type (e.g., `az_rate_deck_db`, `us_rate_deck_db`).
    - **Table/Object Store:** Dynamically named based on the uploaded filename (e.g., `mycarrier_rates_2024`).
- **Data Pipeline:** File Input -> Client-Side Parsing (PapaParse) -> Column Mapping UI -> Standardization Logic -> IndexedDB Bulk Insert (Dexie).
- **Relevant Code:** `AZRateSheetView.vue`, `az-rate-sheet.service.ts`, `useDexieDB.ts`, `stores/az-store.ts`, `types/app-types.ts` (DB names).

**2.2. A-Z Rate Comparison**

- **Trigger:** User uploads two valid AZ rate decks.
- **Frontend:**
  - **Processing:** Comparison logic is offloaded to a Web Worker (`az-comparison.worker.ts`).
  - **Data Source:** Worker likely queries the two relevant tables/object stores from `az_rate_deck_db` via Dexie.
  - **Comparison Logic:** Compares records based on dial codes, calculates differences.
  - **Storage (Results):** Comparison results are stored in a dedicated IndexedDB table (`az_comparison_results` within `az_pricing_comparison_db` - _Correction: DB name likely `az_rate_deck_db` or similar based on other patterns, result store name seems correct_).
  - **Display:** `AZDetailedComparisonTable.vue` queries the results table (potentially filtered/paginated) and displays data.
  - **Features:** Filtering (match status, cheaper file), search (dial code, destination name), export (queries current view from IndexedDB).
- **Data Pipeline:** Trigger -> Worker Initiation -> Dexie Queries (Input Tables) -> Comparison Logic (Worker) -> Dexie Bulk Insert (Results Table) -> UI Query (Dexie) -> Table Display.
- **Relevant Code:** `az-comparison.worker.ts`, `AZDetailedComparisonTable.vue`, `stores/az-store.ts`, `useDexieDB.ts`.

**2.3. U.S. Rate Comparison**

- **Trigger:** User uploads two valid US rate decks.
- **Frontend:** Similar architecture to AZ Comparison.
  - **Processing:** Web Worker(s) handle comparison.
  - **Data Source:** Relevant tables in `us_rate_deck_db` (Dexie) and potentially `lerg_db` (Dexie) for enrichment.
  - **Storage (Results):** Comparison results stored in `us_pricing_comparison_db` (Dexie).
  - **Display:** `USDetailedComparisonTable.vue` queries results, displays Interstate/Intrastate, includes LERG-derived data.
  - **Features:** Filtering, search, export, average rate summary for filtered view.
- **Data Pipeline:** Similar to AZ, with added step of potentially querying `lerg_db` in the worker.
- **Relevant Code:** Specific US comparison worker(s), `USDetailedComparisonTable.vue`, `stores/us-store.ts`, `useDexieDB.ts`.

**2.4. LERG Data Handling**

- **Source:** Canonical LERG data resides in Supabase PostgreSQL (`lerg` table).
- **Admin Upload:** Superadmins upload/manage LERG data in Supabase (mechanism not fully detailed, potentially direct DB access or dedicated admin UI/function).
- **Client Sync:** Authenticated users automatically download LERG data.
  - **Trigger:** Likely on login or app initialization.
  - **Frontend Service:** `LergService` calls a Supabase Edge Function (e.g., `get-lerg-data`) or performs a direct authenticated query.
  - **Storage:** Data is stored locally in `lerg_db` (IndexedDB via Dexie).
- **Adding Records (Admin):**
  - **UI:** Form in `AdminView.vue`.
  - **Frontend Logic:** `useLergData.ts` composable calls `LergService.addSingleRecord`.
  - **Service:** `LergService` invokes Supabase Edge Function `add-lerg-record`.
  - **Backend:** `add-lerg-record` Edge Function validates input and inserts into Supabase `lerg` table.
  - **Sync Update:** After successful insert, the `useLergData` composable triggers a full re-sync (`initializeLergData`) to update the local `lerg_db`.
- **Data Pipeline (Sync):** App Init/Login -> `LergService` -> Supabase Function/Query -> Supabase DB -> Response -> Dexie Bulk Insert (`lerg_db`).
- **Data Pipeline (Add):** Admin UI -> `useLergData` -> `LergService` -> Supabase Function (`add-lerg-record`) -> Supabase DB -> Success Response -> Trigger Full Sync Pipeline.
- **Relevant Code:** `services/lerg.service.ts`, `composables/useLergData.ts`, `stores/lerg-store.ts`, `pages/AdminView.vue`, `supabase/functions/add-lerg-record/`, `supabase/functions/get-lerg-data/` (assumed). `useDexieDB.ts`, `types/app-types.ts`. `types/domains/lerg-types.ts`

**2.5. Single File Analysis Reports (AZ/US Enhanced Code Reports)**

- **Trigger:** Successful upload of a single AZ or US rate deck.
- **Frontend:**
  - **Processing:** Analysis logic offloaded to Web Workers (`az-analyzer.worker.ts`, `us-npa-analyzer.worker.ts`).
  - **Data Source:** Worker queries the relevant table from `az_rate_deck_db` or `us_rate_deck_db` (Dexie). US worker also queries `lerg_db`.
  - **Analysis Logic:** Calculates statistics (total codes, destination counts), performs country/NPA lookups (using `INT_COUNTRY_CODES` / LERG data).
  - **Storage:** Analysis results may be stored temporarily in component state or potentially a dedicated summary store/table if results need persistence (less likely based on description).
  - **Display:** Dedicated components (`AZEnhancedCodeReport`, `USEnhancedCodeReport`) display the statistics and breakdowns.
- **Data Pipeline:** Upload Success -> Worker Initiation -> Dexie Query (Input Table + LERG if US) -> Analysis Logic (Worker) -> Post Message Result -> UI Component Update.
- **Relevant Code:** `az-analyzer.worker.ts`, `us-npa-analyzer.worker.ts`, `AZEnhancedCodeReport.vue`, `USEnhancedCodeReport.vue`, `INT_COUNTRY_CODES` (likely from `constants/` or `data/`).

**2.6. A-Z Rate Sheet Discrepancy Resolution (Refactor Target)**

- **Note:** This section describes the _target_ architecture using IndexedDB, refactoring away from Pinia/localStorage.
- **Storage:** Individual `AZRateSheetEntry` records stored in `az_rate_deck_db.entries` table (IndexedDB) with indexes on `destinationName`, `prefix`, `changeCode`, `hasDiscrepancy`.
- **Frontend:**
  - `AZRateSheetTable.vue` fetches data directly from Dexie, likely querying unique `destinationName` first, then fetching records for visible groups (Scalable Option B).
  - Grouping and discrepancy checks happen client-side on fetched data subsets.
  - Updates (`saveRateSelection`, `handleBulkUpdate`) perform `bulkUpdate` operations on the Dexie table, setting `rate` and `hasDiscrepancy: false`.
  - Store (`az-rate-sheet-store`) primarily holds metadata (counts, flags, `lastDbUpdateTime`) and triggers re-fetches via the timestamp.
- **Effective Date Worker:**
  - Main thread queries Dexie for relevant record keys.
  - Keys + settings passed to `effective-date-updater.worker.ts`.
  - Worker connects to Dexie, uses `bulkGet` and `bulkUpdate` to apply date changes based on `changeCode`.
- **Data Pipeline (Update):** UI Interaction -> Dexie `bulkUpdate` -> Update `store.lastDbUpdateTime` -> Table Watcher Trigger -> Dexie Query -> UI Update.
- **Relevant Code:** `AZRateSheetTable.vue`, `az-rate-sheet-store.ts` (refactored), `useDexieDB.ts`, `effective-date-updater.worker.ts`.

---

## 3. Data Storage Summary

- **IndexedDB (Client-Side via Dexie):**
  - `az_rate_deck_db`: Stores uploaded AZ rate decks (table per file), potentially discrepancy resolution entries (`entries` table).
  - `us_rate_deck_db`: Stores uploaded US rate decks (table per file).
  - `lerg_db`: Stores synced LERG data.
  - `rate_sheet_db`: Stores generic uploaded rate sheets.
  - `az_pricing_comparison_db`: Stores AZ comparison results (`az_comparison_results` table).
  - `us_pricing_comparison_db`: Stores US comparison results.
- **Pinia (Client-Side State):** Primarily holds UI state, metadata (counts, filenames, loading/error flags), user settings, and potentially small, non-persistent datasets. Large datasets migrated/migrating to IndexedDB.
- **Supabase PostgreSQL (Cloud):**
  - `lerg` table: Canonical source for LERG data.
  - `users` table: For Supabase Auth.
  - `rates`, `carriers` (potentially deprecated/unused if focus is local-first for user data).

---

## 4. Key Dependencies & Libraries

- **Frontend:** Vue 3, Vite, TypeScript, Pinia, Vue Router, VueUse, Tailwind CSS, Dexie.js, PapaParse.
- **Backend:** Supabase (Postgres, Auth, Edge Functions), Deno (for Edge Functions).

---

## 5. Future Considerations / Areas for Expansion

- Robust cloud synchronization of user-uploaded IndexedDB data to Supabase.
- Stripe integration for payments/subscriptions.
- Enhanced reporting and data visualization.
- Continued performance optimization (Web Vitals, chunking).

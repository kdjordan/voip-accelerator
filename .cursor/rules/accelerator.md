# VoIP Accelerator: Application Overview & Functionality

## Project Purpose

VoIP Accelerator is a modern, local-first web application designed to empower telecom professionals by streamlining the analysis and comparison of Voice over IP (VoIP) pricing and telecommunication code data across different carriers. The application prioritizes a fast, offline-first user experience, leveraging IndexedDB (via DexieJS) for local data storage and Supabase for cloud synchronization, user management, and specialized data handling (like LERG).

## Core Functionality
## trigger
### Supported Data Types

The application is built to handle several types of CSV files common in the telecom industry:

1.  **A-Z Rate Decks (`AZ`):** International calling rate sheets provided by carriers.
2.  **U.S. Rate Decks (`US`):** Domestic (United States) calling rate sheets.
3.  **LERG (Local Exchange Routing Guide):** A database containing North American Numbering Plan Administration (NANPA) data, crucial for routing and rating U.S. calls. (_Note: LERG data upload is restricted to Superadmins_).
4.  **Rate Sheets:** Generic rate sheet format (details may vary).

### Data Processing Workflow

1.  **Upload:** Users upload CSV files (AZ, US, Rate Sheets) via intuitive drag-and-drop interfaces specific to the data type (e.g., separate zones for AZ file 1 vs. AZ file 2).
2.  **Column Mapping:** Upon upload, a modal prompts the user to map the columns from their specific CSV file to the application's standardized internal fields (e.g., 'Dial Code', 'Rate', 'Destination Name'). This handles variations in carrier file formats.
3.  **Standardization & Local Storage:** The application parses the CSV, standardizes the data based on the mapping, and stores it efficiently in IndexedDB using DexieJS. Each file type typically resides in its own database (e.g., `az_rate_deck_db`, `us_rate_deck_db`), with individual files stored as distinct tables (object stores) within that database, named after the original file (e.g., `mycarrier_rates_2024`).
4.  **LERG Synchronization:** LERG data, uploaded by a Superadmin to Supabase, is automatically downloaded and stored locally in IndexedDB (`lerg_db`) for authenticated users. This allows for offline analysis and enrichment of US rate deck comparisons.

### Key Features & Reports

- **Local-First Architecture:** Most data processing and analysis occurs directly in the user's browser using IndexedDB, ensuring responsiveness and offline capability.
- **A-Z Rate Comparison:**
  - Compares two uploaded AZ rate decks.
  - Generates a consolidated, detailed comparison report (`az_pricing_comparison_db`, stored in the `az_comparison_results` table).
  - Displays results in a single, filterable table (`AZDetailedComparisonTable.vue`) showing matched codes, codes unique to each file, rate differences, and percentage differences.
  - Features dynamic filters (by match status, cheaper file using actual filenames) and search capabilities (dial code prefix matching, destination name includes).
  - Allows exporting the current filtered view to CSV.
  - Utilizes a Web Worker (`az-comparison.worker.ts`) for efficient background processing.
- **A-Z Code Summary:**
  - Provides a detailed single-file analysis report (`AZEnhancedCodeReport`) upon successful upload.
  - Displays statistics like total codes, destination counts, and a breakdown by country.
  - Features an expandable country list showing specific destination breakouts (e.g., "MEXICO CELLULAR TELCEL") and their associated dial codes found in the file.
  - Includes advanced search/filtering for the country/breakout list.
  - Uses `INT_COUNTRY_CODES` (derived from `int-countries.json`) for accurate country mapping via longest-prefix matching.
  - Leverages a Web Worker (`az-analyzer.worker.ts`) for report generation.
- **U.S. Rate Comparison:**
  - Compares two uploaded US rate decks, potentially enriched with LERG data.
  - Generates detailed comparison reports (`us_pricing_comparison_db`).
  - Displays results in a single, filterable table (`USDetailedComparisonTable.vue`) similar to the AZ view, with dynamic filename badges in headers and filters.
  - Includes columns for Interstate/Intrastate rates and rate comparisons.
  - Provides an average rate summary for the currently filtered data.
  - Allows exporting the current filtered view to CSV.
  - Utilizes Web Workers for comparison processing.
- **U.S. Code Summary:**
  - Provides a detailed single-file analysis report (`USEnhancedCodeReport`) upon upload.
  - Displays statistics like total codes and breakdowns by rate type (Interstate, Intrastate, Indeterminate).
  - Leverages LERG data for deeper NPA (Numbering Plan Area) analysis.
  - Uses a Web Worker (`us-npa-analyzer.worker.ts`).
- **Consistent UI/UX:** Recent efforts have aligned the UI/UX patterns between the AZ and US sections, including:
  - Replacing drop zones with summary components (`AzCodeSummary`, `USCodeSummary`) after successful upload.
  - Consistent placement and styling of 'Remove' and 'Export' buttons.
  - Dynamic display of filenames in table headers, filters, and badges.

## Architecture & Technology Stack

- **Monorepo Structure:** Code potentially organized within a monorepo (details TBD).
- **Client (`client/`):**
  - **Framework:** Vue 3 (Composition API with `<script setup>`)
  - **Bundler:** Vite
  - **Language:** TypeScript (strict adherence to types, interfaces preferred, no enums)
  - **Styling:** Tailwind CSS (utility-first, custom theme integration)
  - **Routing:** Vue Router
  - **State Management:** Pinia (modular stores like `azStore`, `usStore`)
  - **Async Utilities:** VueUse
  - **Local Database:** Dexie.js (wrapper around IndexedDB, using dynamic schemas)
  - **CSV Parsing:** PapaParse
- **Backend & Cloud:**
  - **Platform:** Supabase
  - **Database:** Supabase PostgreSQL (primarily for LERG, user data)
  - **Authentication:** Supabase Auth
  - **Serverless:** Supabase Edge Functions (potential future use)
  - **Realtime:** Supabase Realtime (potential future use)
- **Phasing Out:** An older Express/Postgres backend is being deprecated in favor of the Supabase-centric approach.

## User Roles

- **`superadmin`:** Can upload and manage core datasets like LERG.
- **`user`:** Can upload and analyze their own AZ/US rate decks, access synced LERG data locally.

## Future Considerations (Planned/Potential)

- **Cloud Sync:** More robust synchronization of user-uploaded data with Supabase.
- **Payments:** Integration with Stripe for subscription plans.
- **Enhanced Reporting:** Further development of reporting and visualization features.
- **Performance Optimizations:** Continued focus on Web Vitals (LCP, FID, CLS), code splitting, and image optimization.

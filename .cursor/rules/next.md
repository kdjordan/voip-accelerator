# Refine A-Z Functionality & Integrate International Data

## Summary of Accomplishments

- **DexieDB Foundation:** Successfully refactored A-Z file processing to use DexieDB for storing rate deck data (`az_rate_deck_db`) and detailed comparison results (`az_pricing_comparison_db`).
- **Dynamic Schemas:** Resolved the critical issue in `useDexieDB.ts` where schemas were hardcoded. The composable now correctly applies dynamic schemas based on the `dbName`.
- **Worker Consolidation:** Combined AZ report generation into a single worker (`az-comparison.worker.ts`) called by `AZService::makeAzCombinedReport`.
- **Store Refactoring:** Cleaned up `az-store.ts` to remove legacy in-memory storage and align state management with the DexieDB-first approach.
- **Sample Data Loading:** Successfully debugged and fixed the AZ sample data loading process in `load-sample-data.ts`.
- **✅ Manual Uploads Fixed:** Resolved issues preventing manual AZ file uploads and re-uploads after removal, including fixing Dexie connection instability caused by `deleteStore()`.
- **✅ Legacy Code Cleanup:** Identified and removed the unused `client/src/services/dexie` directory. Fixed `client/src/composables/useLergData.ts` to use the correct `LergService` singleton and methods.

---

## Current Status

- **✅ AZ File Upload:** Both sample data loading and manual user uploads (including removal and re-upload) for AZ rate decks (`az_rate_deck_db`) are now working reliably.
- **⚙️ Comparison Logic:** The basic structure for generating and storing AZ comparisons (`az_pricing_comparison_db`) is in place but needs review and refinement.
- **🧹 Codebase:** Legacy Dexie service structure removed, relevant composables updated.

---

## Next Phase Goals

1.  **Integrate International Country Data:** Convert the static `int-countries.json` into a TypeScript constant file (`int-country-codes.ts`) for easy lookup and use within the application, particularly for enriching AZ reports.
2.  **Refine AZ Comparison Logic:** Review and potentially refactor the AZ comparison generation, storage, and display (`az_pricing_comparison_db`, worker, service, UI) to ensure robustness and align with established US patterns where beneficial.
3.  **Verify AZ Worker & Finalize Cleanup:** Confirm the AZ comparison worker runs correctly and complete any remaining cleanup tasks (e.g., finalizing the `removeTable` comparison deletion strategy).

---

## Action Items & Checklist

### 1. International Country Data Integration

- [x] **Define TypeScript Interface:** Create an interface (`IntCountryInfo`) in `client/src/types/domains/intl-types.ts` (or a new dedicated file like `client/src/types/domains/intl-types.ts`?) to represent the structure of each country entry (e.g., `countryName: string`, `isoCode: string`, `dialCode: number | string`).
  - _**(Prompt):** What should the exact field names and types be for the `IntCountryInfo` interface? Should `dialCode` be a `number`, `string`, or handle multiple codes like the Dominican Republic (`1809, 1829, 1849`)? How should the `ISO CODE` (`AF / AFG`) be stored - just the 2-letter code, 3-letter code, or both?_
    //// The interface should be dialCode: string, countryName: string, isoCode: string, dialCode: 'Array of strings for multiple codes'
    /// We should store the 2 character ISO code
- [x] **Convert JSON to TS Constant:**
  - Create a new file: `client/src/types/constants/int-country-codes.ts`.
  - Read `client/src/data/int-countries.json`.
  - Transform the JSON array into a TypeScript `Record<string, IntCountryInfo>` where the key is the 2-letter ISO code (or country name?) for efficient lookup.
  - Export the constant (e.g., `INT_COUNTRY_CODES`) and potentially helper functions (e.g., `getCountryInfoByIsoCode(code: string): IntCountryInfo | undefined`, `getDialCode(code: string): string | number | undefined`).
  - _**(Prompt):** What should be the primary key for the `INT_COUNTRY_CODES` Record? The 2-letter ISO code seems standard, similar to `COUNTRY_CODES`. Agree?_
    ///Since the user will primarily be looking up INT countries by dialCode or Country name, the CountryName should be the primary key.
- [ ] **(Next Step):** Integrate lookup logic into AZ report generation/display.
  - _**(Prompt):** Where exactly in the AZ processing/display flow will this country information be used? (e.g., In the worker? In the UI component? In the `AZService`?)_

### 2. AZ Worker Verification

- [ ] **Confirm Worker Instantiation & Execution:** Test the "Generate Reports" button (which triggers `AZService::makeAzCombinedReport`).
  - Does the worker (`az-comparison.worker.ts`) run without errors?
  - Does it successfully receive data, perform the comparison, and post back results (`pricingReport`, `codeReport`, `detailedComparisonData`)?
  - Check browser console for worker logs and any errors during report generation.

### 3. AZ Comparison Logic Review & Refinement

- [ ] **Review `AZService::makeAzCombinedReport`:**
  - _**(Prompt):** Does the current logic (load data -> run worker -> store summaries -> store detailed data -> update store) seem robust and handle potential errors well?_
  - _**(Prompt):** How does this compare to `us.service.ts::processComparisons`? Should we adopt any patterns from the US service?_
- [ ] **Review `az-comparison.worker.ts`:**
  - _**(Prompt):** Is the core comparison logic efficient and accurate? Does it correctly handle edge cases?_
- [ ] **Review `az_pricing_comparison_db` & `AZDetailedComparisonEntry`:**
  - _**(Prompt):** Is the current schema sufficient? Does the US comparison (`us_pricing_comparison_db`) store detailed results similarly? Should the AZ schema align more closely?_
- [ ] **Review Report UI (`AZPricingReport.vue`, `AZCodeReport.vue`):**
  - _**(Prompt):** How should loading states and errors be handled? Is the detailed comparison display clear?_

### 4. Finalize AZ Cleanup

- [ ] **Implement `AZService::removeTable` Comparison Deletion:**
  - Finalize the logic to delete corresponding comparison table(s) from `az_pricing_comparison_db` when a rate deck table is removed.
  - _**(Prompt - Decision Needed):** When `azfile1` is removed, how to determine comparison table names (e.g., `azfile1_vs_azfile2`, `azfile2_vs_azfile1`) to delete?_
    - _Option A: Check `azStore.filesUploaded` for the other filename._
    - _Option B: Store the generated `detailedComparisonTableName` in `azStore`._
    - _Option C: Query `az_pricing_comparison_db` for table names containing `tableName` (less precise)._
    - _Which approach? (Leaning towards A or B)._

---

## AI Context & Debugging Log (Updated)

- **Focus:** Refactoring AZ to use DexieDB, cleaning up legacy code, preparing for international data integration.
- **Resolution:** Manual AZ uploads fixed. Legacy Dexie service removed. `useLergData.ts` updated to use `LergService` singleton. Created `IntCountryInfo` interface and `INT_COUNTRY_CODES` constant from JSON data.
- **Next:** Integrate `INT_COUNTRY_CODES` lookups into the AZ workflow, then proceed with AZ worker verification and comparison logic refinement.

---

## Build AZ Enhanced Code Report Functionality (New Phase)

**Goal:** Replicate the single-file code summary functionality seen in `USCodeSummary.vue` for A-Z files, providing detailed statistics and country-based coverage analysis. This requires creating a new enhanced report structure, a worker to generate it, and a UI component to display it.

**Context:** We have successfully integrated `INT_COUNTRY_CODES` for looking up international country data. Now, we need to leverage this, along with uploaded A-Z file data, to generate a comprehensive single-file analysis report, similar to the `USEnhancedCodeReport` generated by `us-npa-analyzer.worker.ts`.

### Action Items & Checklist

1.  **Define `AZEnhancedCodeReport` Interface:**

    - Create a new interface (e.g., `AZEnhancedCodeReport`) in `client/src/types/domains/az-types.ts`.
    - This interface should structure the report data, including:
      - `fileInfo`: { `fileName`: string, `totalCodes`: number }
      - `codeStats`: { `systemCodeCount`: number, `fileCodeCount`: number, `coveragePercent`: number }
      - `destinationStats`: { `totalDestinations`: number, `uniqueDestinationPercent`: number }
      - `countries`: `AZCountryBreakdown[]`
        - `AZCountryBreakdown`: { `countryName`: string, `isoCode`: string, `coveragePercent`: number, `totalSystemDialCodes`: number, `fileDialCodes`: { `dialCode`: string, `destName`: string }[] } // Include destName from file
    - _**(Prompt):** Does the proposed `AZEnhancedCodeReport` structure capture all the necessary fields? Specifically for `codeStats`:_
      - _Should `systemCodeCount` be the total count of *unique individual dial codes* across all countries in `INT_COUNTRY_CODES`?_
      - _Should `fileCodeCount` be the count of *unique dial codes* present in the uploaded file?_

2.  **Create `az-analyzer.worker.ts`:**

    - Create the worker file: `client/src/workers/az-analyzer.worker.ts`.
    - Input: `fileName: string`, `fileData: AZStandardizedData[]`, `intCountryData: Record<string, IntCountryInfo>`.
    - Logic:
      - Calculate `totalCodes` (length of `fileData`).
      - Calculate `systemCodeCount` (based on clarification from prompt 1).
      - Calculate `fileCodeCount` (count unique `dialCode` in `fileData`).
      - Calculate `codeStats.coveragePercent`.
      - Calculate `totalDestinations` (count unique `destName` in `fileData`).
      - Calculate `destinationStats.uniqueDestinationPercent`.
      - Generate `countries` breakdown:
        - Iterate through `intCountryData`.
        - For each country, find matching `dialCode` entries in `fileData`.
        - Calculate country `coveragePercent`.
        - Store country info, coverage, and the list of matching `fileDialCodes` including their `destName` from the `fileData`.
    - Output: The generated `AZEnhancedCodeReport`.

3.  **Update `az-store.ts`:**

    - Add state: `enhancedCodeReports: Map<string, AZEnhancedCodeReport>()`.
    - Add getter: `getEnhancedReportByFile(fileName: string): AZEnhancedCodeReport | null`.
    - Add action: `setEnhancedCodeReport(report: AZEnhancedCodeReport)`.
    - Add relevant reset logic in `resetFiles` and `removeFile`.

4.  **Update `AZService.ts`:**

    - In the function that processes and stores the uploaded AZ file (likely after storing data in Dexie):
      - Retrieve the stored `AZStandardizedData[]`.
      - Get `INT_COUNTRY_CODES`.
      - Instantiate and post data to `az-analyzer.worker.ts`.
      - Add an event listener for the worker's response.
      - On receiving the report, call `azStore.setEnhancedCodeReport(report)`.

5.  **Create `AZCodeSummary.vue` Component:**

    - Create the component file: `client/src/components/az/AZCodeSummary.vue`.
    - Accept `componentId: 'az1' | 'az2'` as a prop.
    - Use the `componentId` to get the `fileName` from `azStore`.
    - Use the `fileName` to get the `AZEnhancedCodeReport` from `azStore`.
    - Render the report data using Tailwind CSS, mimicking the layout of `USCodeSummary.vue` with the specified sections:
      - Total Codes
      - Code Statistics (System Count, File Count, Coverage %)
      - Destination Statistics (Total Destinations, Unique Destination %)
      - Country Coverage (similar to US NPA Coverage):
        - Search input (filter by dial code, iso code, destination name, country name).
        - List of countries, expandable to show found dial codes and their associated destination names.
    - Implement the search/filtering logic for the Country Coverage section.

6.  **Integrate `AZCodeSummary.vue`:**
    - Add the `AZCodeSummary` component to the relevant view where single AZ file reports should be displayed (likely below the `AZFileUpload` component or in a dedicated report area). Pass the correct `componentId`.

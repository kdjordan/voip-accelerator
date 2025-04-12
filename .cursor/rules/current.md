# User US CSV uploads

## Flow

1.  **File Selection:** User selects/drops a CSV file (`USFileUploads.vue`).
2.  **Preview & Mapping:** `PreviewModal` shown; user confirms column roles (NPANXX, rates, etc.) and start line.
3.  **Processing Trigger (`handleModalConfirm` in `USFileUploads.vue`):** Initiates processing for the selected file and component (`us1` or `us2`).
4.  **Core File Processing (`usService.processFile`):**
    - Parses CSV (PapaParse).
    - Validates rows, extracts/derives NPANXX, NPA, NXX, and rates.
    - Handles indeterminate rate logic.
    - Stores valid records (`USStandardizedData`) in Dexie (`us_rate_deck_db` table named after the file).
    - Stores invalid rows in `usStore.invalidRows`.
    - Registers the file in `usStore.filesUploaded` (mapped to `us1` or `us2`).
    - Calls `usService.calculateFileStats`.
5.  **File Statistics Calculation (`usService.calculateFileStats`):**
    - Retrieves file-specific data from Dexie.
    - Calculates total codes, unique NPAs, average rates.
    - Calculates US NPA coverage % using LERG data (`lergStore`).
    - Stores results in `usStore.fileStats` (mapped to `us1` or `us2`).
6.  **Enhanced NPA Analysis Trigger (`handleModalConfirm` in `USFileUploads.vue`):**
    - After `processFile` completes and polling confirms data is in Dexie, retrieves the processed data via `usService.getData`.
    - Calls local `generateEnhancedCodeReport` function.
7.  **Enhanced Report Generation (`generateEnhancedCodeReport` in `USFileUploads.vue`):**
    - Prepares LERG data via `prepareLergWorkerData` (gets data from `lergStore`).
    - Instantiates and runs `us-npa-analyzer.worker.ts`.
    - Sends file data and LERG data to the worker.
    - Receives the detailed `USEnhancedCodeReport` from the worker.
8.  **Worker Analysis (`us-npa-analyzer.worker.ts`):**
    - Groups file data by NPA.
    - Iterates through LERG country data (US, CA, others - skips invalid/empty country codes).
    - For each country with matching NPAs in the file, creates a detailed breakdown (`USCountryBreakdown`) including state/province details (for US/CA), coverage percentages, and rate statistics per region.
9.  **Store Enhanced Report (`handleModalConfirm` in `USFileUploads.vue`):** Stores the received `USEnhancedCodeReport` in `usStore.enhancedCodeReports`.
10. **UI Update:** Components (`USCodeSummary.vue`, etc.) react to `usStore.fileStats` and `usStore.enhancedCodeReports` to display results.
11. **Two-File Reports (`handleReportsAction` in `USFileUploads.vue`):**
    - When two files are present and user requests reports:
    - Calls `usService.makeUsCodeReport` (generates comparison stats like matched codes) -> updates `usStore.codeReport`.
    - Calls `usService.processComparisons` (performs detailed row-by-row comparison, stores results in `us_pricing_comparison_db`).
    - Calls `usService.fetchPricingReportSummary` (reads comparison results, calculates summary stats) -> updates `usStore.pricingReport`.
12. **Sample Data Loading (`load-sample-data.ts`):**
    - Clears existing US data.
    - Fetches sample files (`UStest.csv`, `UStest1.csv`).
    - For each file:
      - Calls `usService.processFile` (handles steps 4 & 5).
      - Calls `analyzer.analyzeTableNPAs` (from `USNPAAnalyzerService`) to perform enhanced analysis (steps 6-9 for sample data).

## Components list

- USFileuploads.vue : fileuploads and report orchestration
- USView.vue : parent
- USContententHeader.vue : controls display of other components for user
- USCodeSummary.vue : displays enhanced code reports from Pinia (`fileStats` and `enhancedCodeReports`)
- USPricingReport.vue : displays pricing reports from Pinia (`pricingReport`)
- USDetailedComparisonTable.vue : displays code by code comparison report (reads from `us_pricing_comparison_db`)

## Pinia Store (`usStore`)

```typescript
state: () => ({
    filesUploaded: new Map<string, { fileName: string }>(), // Maps componentId ('us1', 'us2') to filename
    showUploadComponents: true, // Controls visibility of upload vs reports
    isCodeReportReady: false, // Flag for two-file code comparison report
    isPricingReportReady: false, // Flag for two-file pricing comparison report
    isPricingReportProcessing: false, // Loading state for pricing report generation
    activeReportType: 'files' as ReportType, // Currently viewed tab
    pricingReport: null as USPricingReport | null, // Summary report for two-file comparison
    codeReport: null as USCodeReport | null, // Basic stats report for two-file comparison
    enhancedCodeReports: new Map<string, USEnhancedCodeReport>(), // Detailed single-file analysis (keyed by filename)
    uploadingComponents: {} as Record<string, boolean>, // Tracks loading state per component
    tempFiles: new Map<string, File>(), // Holds file during preview modal
    invalidRows: new Map<string, InvalidUsRow[]>(), // Invalid rows per file (keyed by filename)
    inMemoryData: new Map<string, USStandardizedData[]>(), // Deprecated/potentially unused in-memory storage
    fileStats: new Map< // Basic stats per file (keyed by componentId 'us1'/'us2')
      string,
      {
        totalCodes: number;
        totalDestinations: number; // Unique NPAs
        uniqueDestinationsPercentage: number;
        usNPACoveragePercentage: number;
        avgInterRate: number;
        avgIntraRate: number;
        avgIndetermRate: number;
      }
    >(),
```

### AI CONTEXT (Summary of Recent Work)

1.  **Refactored Single-File Analysis:** Decoupled `generateEnhancedCodeReport` from the store in `USFileUploads.vue` for better error handling and separation of concerns.
2.  **LERG Data Handling:** Corrected `prepareLergWorkerData` to use reliable store getters. Fixed `LergService::processDataChunk` to prevent records with invalid/empty country codes from creating an "Unknown" category.
3.  **Race Condition Fix:** Implemented polling (`pollUntilDataReady` in `USFileUploads.vue`) to ensure Dexie writes complete before attempting reads in `handleModalConfirm`.
4.  **Average Rate Bug:** Fixed `USCodeSummary.vue` to read average rates from the correct store state (`usStore.fileStats`) instead of the worker-generated `enhancedCodeReports`.
5.  **Sample Data Loading:** Refactored `load-sample-data.ts` to correctly call the necessary service (`usService.processFile`) and analysis (`analyzer.analyzeTableNPAs`) steps in sequence after previous refactoring had inadvertently removed the analysis step.
6.  **Cleanup:** Removed temporary debugging logs added during the investigation phases.

**Current Status:** The US CSV upload, processing, analysis (single and dual file), and sample data loading functionalities are working correctly based on recent fixes.

---

### Plan

1.  [x] Debug Average Rates Calculation (Completed)
2.  [x] Investigate "Unknown" country category source. (Completed)
3.  [x] Remove temporary debugging logs. (Completed)
4.  [x] Refactor US sample data loading. (Completed)
5.  [x] Fix sample data loading analysis trigger. (Completed)

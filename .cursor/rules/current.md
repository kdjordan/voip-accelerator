# User US CSV uploads

## Flow

- user selects a file or drags and drops a file
- PreviewModal is launched and user select column roles to extract data
- Data is processed and stored in IndexDB using DexieJS composable : useDeixieDB.ts
- worker is kicked off to generate enhancedCodeReport : us-npa-analyzer.worker.ts
- us.service.ts is coordinating most of this functionality

## Components list

- USFileuploads.vue : fileuploads and report orchestration
- USView.vue : parent
- USContententHeader.vue : controls display of other components for user
- USCodeSummary.vue : displays enhanced code reports from Pinia
- USPricingReport.vue : displays pricing reports from Pinia
- USDetailedComparisonTable.vue : displays code by code comparison report

## Pinia Store

```
state: () => ({
    filesUploaded: new Map<string, { fileName: string }>(),
    showUploadComponents: true,
    isCodeReportReady: false,
    isPricingReportReady: false,
    isPricingReportProcessing: false,
    activeReportType: 'files' as ReportType,
    pricingReport: null as USPricingReport | null,
    codeReport: null as USCodeReport | null,
    enhancedCodeReports: new Map<string, USEnhancedCodeReport>(),
    uploadingComponents: {} as Record<string, boolean>,
    tempFiles: new Map<string, File>(),
    invalidRows: new Map<string, InvalidUsRow[]>(),
    inMemoryData: new Map<string, USStandardizedData[]>(),
    fileStats: new Map<
      string,
      {
        totalCodes: number;
        totalDestinations: number;
        uniqueDestinationsPercentage: number;
        usNPACoveragePercentage: number;
        avgInterRate: number;
        avgIntraRate: number;
        avgIndetermRate: number;
      }
    >(),
```

### AI CONTEXT

Refactored the generation and handling of the `USEnhancedCodeReport` within the `USFileUploads.vue` component. The `generateEnhancedCodeReport` function now returns the report object directly upon success or throws an error on failure, decoupling it from the Pinia store. The calling function, `handleModalConfirm`, is now responsible for catching the returned report (or error) and updating the `usStore` accordingly. This improves separation of concerns and error handling for the single-file code analysis report feature.

Resolved issues with LERG data preparation (`prepareLergWorkerData`) by ensuring it reads from the correct, populated store properties (`usStates`, `canadaProvinces`, `otherCountries`) instead of potentially empty legacy properties. Added checks to ensure these source maps have data before proceeding.

Implemented a polling mechanism (`pollUntilDataReady`) in `handleModalConfirm` to reliably wait for `service.processFile` to finish writing data to IndexedDB before attempting to read it back with `service.getData`. This addresses the race condition previously encountered.

Added logging in the worker (`us-code-report.worker.ts`) to verify the structure and content of the data it receives (`fileData` and `lergData`).

**Debugging Average Rates (Resolved):**

- Added logging to `us.service.ts::processFile` to confirm rates were parsed correctly as numbers. (Confirmed)
- Added logging to `USFileUploads.vue::handleModalConfirm` to confirm the numeric rates were being passed to the worker. (Confirmed)
- Added detailed logging to `us-code-report.worker.ts::calculateRateStats` to trace rate processing within the worker. (Confirmed worker calculated averages correctly).
- Added logging to `us.service.ts::calculateFileStats` to check overall file stats calculation. (Confirmed service calculated and stored overall averages correctly in `usStore.fileStats`).
- **Identified Issue:** The `USCodeSummary.vue` component was incorrectly reading average rates from the `enhancedCodeReports` state (worker results per breakdown) instead of the `fileStats` state (overall file averages).
- **Fix:** Modified the `averageRates` computed property in `USCodeSummary.vue` to read directly from `usStore.fileStats` using the `componentId` prop.

**Current Status:** The average rates are now displayed correctly in the UI. However, a new minor issue appeared: an "Unknown" country category with 0% coverage is shown in the NPA Coverage section of `USCodeSummary.vue`.

---

### Plan

1.  [x] Debug Average Rates Calculation (Completed)
2.  [ ] Investigate "Unknown" country category source.
3.  [ ] Remove temporary debugging logs.

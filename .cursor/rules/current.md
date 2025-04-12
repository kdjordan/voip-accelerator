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

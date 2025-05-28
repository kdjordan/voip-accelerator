# Implementation Plan: Code Report Margin Breakdown

This document outlines the steps to implement the "SELL TO" and "BUY FROM" margin breakdown feature in the US Code Report.

## 1. Data Structure Modifications (`client/src/types/domains/us-types.ts`)

We need to define new types to store the detailed margin breakdown.

```typescript
// In client/src/types/domains/us-types.ts

// Represents the data for a single margin bucket (e.g., <10%, 10-20%)
export interface MarginBucketDetail {
  matchInter: number; // Count of inter-state matches in this bucket
  percentInter: number; // Percentage of total comparable inter-state codes
  matchIntra: number; // Count of intra-state matches in this bucket
  percentIntra: number; // Percentage of total comparable intra-state codes
}

// Represents the full breakdown for either "SELL TO" or "BUY FROM"
export interface MarginAnalysis {
  lessThan10: MarginBucketDetail;
  between10And20: MarginBucketDetail;
  between20And30: MarginBucketDetail;
  between30And40: MarginBucketDetail;
  between40And50: MarginBucketDetail;
  between50And60: MarginBucketDetail;
  between60And70: MarginBucketDetail;
  between70And80: MarginBucketDetail;
  between80And90: MarginBucketDetail;
  between90And100: MarginBucketDetail;
  greaterThan100: MarginBucketDetail;
  totalInterMatches: number; // Sum of all inter-matches across buckets
  totalIntraMatches: number; // Sum of all intra-matches across buckets
  totalPercentInter: number; // Sum of all inter percentages
  totalPercentIntra: number; // Sum of all intra percentages
}

// Specific structure for the 0% margin scenario
export interface ZeroMarginDetail {
  matchInter: number;
  percentInter: number;
  matchIntra: number;
  percentIntra: number;
}

// Update USCodeReport to include these new structures
export interface USCodeReport {
  file1: USFileReport; // Keep existing structure
  file2: USFileReport; // Keep existing structure
  matchedCodes: number;
  nonMatchedCodes: number;
  matchedCodesPercentage: number;
  nonMatchedCodesPercentage: number;
  matchedNPAs: number;
  totalUniqueNPAs: number;

  // New fields for detailed margin analysis
  sellToAnalysis?: MarginAnalysis; // Optional because it requires two files
  buyFromAnalysis?: MarginAnalysis; // Optional
  zeroMarginDetail?: ZeroMarginDetail; // Optional
  totalComparableInterCodes?: number; // Total codes used as a base for inter %
  totalComparableIntraCodes?: number; // Total codes used as a base for intra %
}

// Ensure USFileReport and other related types are correctly defined or imported
// For example:
export interface USFileReport {
  fileName: string;
  totalNPANXX: number;
  uniqueNPA: number;
  uniqueNXX: number;
  coveragePercentage: number; // Consider if this is still needed or how it fits
  rateStats: {
    interstate: RateStats;
    intrastate: RateStats;
    indeterminate: RateStats;
  };
}

export interface RateStats {
  average: number;
  median: number;
  min: number;
  max: number;
  count: number;
}

// ... any other relevant existing types
```

## 2. State Management (`client/src/stores/us-store.ts`)

The `codeReport` state in `us-store.ts` will automatically use the updated `USCodeReport` type defined above. No explicit changes to the store's structure are needed beyond ensuring it imports the updated type.

- The `setCodeReport` action will receive the enriched `USCodeReport` object.
- Getters like `getCodeReport` will return this enriched object.

## 3. Service Logic (`client/src/services/us.service.ts`)

The primary logic changes will be in the `makeUsCodeReport` method.

```typescript
// In client/src/services/us.service.ts

// Helper function to initialize MarginBucketDetail
function createMarginBucketDetail(): MarginBucketDetail {
  return {
    matchInter: 0,
    percentInter: 0,
    matchIntra: 0,
    percentIntra: 0,
  };
}

// Helper function to initialize MarginAnalysis
function createMarginAnalysis(): MarginAnalysis {
  return {
    lessThan10: createMarginBucketDetail(),
    between10And20: createMarginBucketDetail(),
    between20And30: createMarginBucketDetail(),
    between30And40: createMarginBucketDetail(),
    between40And50: createMarginBucketDetail(),
    between50And60: createMarginBucketDetail(),
    between60And70: createMarginBucketDetail(),
    between70And80: createMarginBucketDetail(),
    between80And90: createMarginBucketDetail(),
    between90And100: createMarginBucketDetail(),
    greaterThan100: createMarginBucketDetail(),
    totalInterMatches: 0,
    totalIntraMatches: 0,
    totalPercentInter: 0,
    totalPercentIntra: 0,
  };
}

// Helper function to initialize ZeroMarginDetail
function createZeroMarginDetail(): ZeroMarginDetail {
  return {
    matchInter: 0,
    percentInter: 0,
    matchIntra: 0,
    percentIntra: 0,
  };
}


// Updated makeUsCodeReport method
async makeUsCodeReport(file1Name: string, file2Name: string): Promise<USCodeReport> {
  try {
    const table1Name = file1Name.toLowerCase().replace('.csv', '');
    const table2Name = file2Name ? file2Name.toLowerCase().replace('.csv', '') : '';

    const { getDB } = this.dexieDB;
    const usDb = await getDB(DBName.US);

    const file1Data = await usDb.table<USStandardizedData>(table1Name).toArray();
    let file2Data: USStandardizedData[] = [];
    if (table2Name) {
      file2Data = await usDb.table<USStandardizedData>(table2Name).toArray();
    }

    // --- Basic File Stats (largely existing logic) ---
    const file1NPAs = new Set<string>(file1Data.map(r => r.npa));
    const file1StatsData = {
      inter: this.calculateRateStats(file1Data.map((r) => r.interRate)),
      intra: this.calculateRateStats(file1Data.map((r) => r.intraRate)),
      indeterm: this.calculateRateStats(file1Data.map((r) => r.indetermRate)),
    };
    const reportFile1: USFileReport = {
      fileName: file1Name,
      totalNPANXX: file1Data.length,
      uniqueNPA: file1NPAs.size,
      uniqueNXX: new Set(file1Data.map((r) => r.nxx)).size,
      coveragePercentage: 0, // TODO: Define coverage
      rateStats: {
        interstate: file1StatsData.inter,
        intrastate: file1StatsData.intra,
        indeterminate: file1StatsData.indeterm,
      },
    };

    let reportFile2: USFileReport | undefined = undefined;
    let file2NPAs = new Set<string>();
    if (file2Data.length > 0 && file2Name) {
      file2NPAs = new Set<string>(file2Data.map(r => r.npa));
      const file2StatsData = {
        inter: this.calculateRateStats(file2Data.map((r) => r.interRate)),
        intra: this.calculateRateStats(file2Data.map((r) => r.intraRate)),
        indeterm: this.calculateRateStats(file2Data.map((r) => r.indetermRate)),
      };
      reportFile2 = {
        fileName: file2Name,
        totalNPANXX: file2Data.length,
        uniqueNPA: file2NPAs.size,
        uniqueNXX: new Set(file2Data.map((r) => r.nxx)).size,
        coveragePercentage: 0, // TODO: Define coverage
        rateStats: {
          interstate: file2StatsData.inter,
          intrastate: file2StatsData.intra,
          indeterminate: file2StatsData.indeterm,
        },
      };
    }

    let matchedCodes = 0;
    let nonMatchedCodes = 0;
    let matchedCodesPercentage = 0;
    let nonMatchedCodesPercentage = 0;
    let matchedNPAs = 0;
    let totalUniqueNPAs = 0;

    let sellToAnalysis: MarginAnalysis | undefined = undefined;
    let buyFromAnalysis: MarginAnalysis | undefined = undefined;
    let zeroMarginDetail: ZeroMarginDetail | undefined = undefined;
    let totalComparableInterCodes = 0;
    let totalComparableIntraCodes = 0;

    if (file1Data.length > 0 && file2Data.length > 0) {
      sellToAnalysis = createMarginAnalysis();
      buyFromAnalysis = createMarginAnalysis();
      zeroMarginDetail = createZeroMarginDetail();

      const file2Map = new Map<string, USStandardizedData>();
      file2Data.forEach(record => file2Map.set(record.npanxx, record));

      const allNpanxxFile1 = new Set(file1Data.map(r => r.npanxx));
      const allNpanxxFile2 = new Set(file2Data.map(r => r.npanxx));
      const allUniqueNpanxxCombined = new Set([...allNpanxxFile1, ...allNpanxxFile2]);

      for (const record1 of file1Data) {
        const record2 = file2Map.get(record1.npanxx);
        if (record2) {
          matchedCodes++;

          // Inter-state rate comparison
          if (typeof record1.interRate === 'number' && typeof record2.interRate === 'number') {
            totalComparableInterCodes++;
            const marginInter = (record2.interRate - record1.interRate) / record1.interRate;

            if (record1.interRate < record2.interRate) { // SELL TO opportunity
              this.categorizeMargin(marginInter, sellToAnalysis, 'inter');
            } else if (record1.interRate > record2.interRate) { // BUY FROM opportunity
              // For BUY FROM, margin is (R1 - R2) / R2 (how much cheaper we buy than they sell)
              // Or, if we want to keep it relative to R1: (R1 - R2) / R1
              // User confirmed: if file1 > file2, it's a BUY FROM. Margin relative to file1 rate.
              const buyMarginInter = (record1.interRate - record2.interRate) / record1.interRate;
              this.categorizeMargin(buyMarginInter, buyFromAnalysis, 'inter');
            } else { // Zero margin
              zeroMarginDetail.matchInter++;
            }
          }

          // Intra-state rate comparison
          if (typeof record1.intraRate === 'number' && typeof record2.intraRate === 'number') {
            totalComparableIntraCodes++;
            const marginIntra = (record2.intraRate - record1.intraRate) / record1.intraRate;

            if (record1.intraRate < record2.intraRate) { // SELL TO opportunity
              this.categorizeMargin(marginIntra, sellToAnalysis, 'intra');
            } else if (record1.intraRate > record2.intraRate) { // BUY FROM opportunity
               const buyMarginIntra = (record1.intraRate - record2.intraRate) / record1.intraRate;
              this.categorizeMargin(buyMarginIntra, buyFromAnalysis, 'intra');
            } else { // Zero margin
              zeroMarginDetail.matchIntra++;
            }
          }
        }
      }
      nonMatchedCodes = allUniqueNpanxxCombined.size - matchedCodes;
      matchedCodesPercentage = allUniqueNpanxxCombined.size > 0 ? (matchedCodes / allUniqueNpanxxCombined.size) * 100 : 0;
      nonMatchedCodesPercentage = allUniqueNpanxxCombined.size > 0 ? (nonMatchedCodes / allUniqueNpanxxCombined.size) * 100 : 0;

      // Calculate percentages for each bucket
      this.calculateBucketPercentages(sellToAnalysis, totalComparableInterCodes, totalComparableIntraCodes);
      this.calculateBucketPercentages(buyFromAnalysis, totalComparableInterCodes, totalComparableIntraCodes);
      if (zeroMarginDetail) {
        zeroMarginDetail.percentInter = totalComparableInterCodes > 0 ? (zeroMarginDetail.matchInter / totalComparableInterCodes) * 100 : 0;
        zeroMarginDetail.percentIntra = totalComparableIntraCodes > 0 ? (zeroMarginDetail.matchIntra / totalComparableIntraCodes) * 100 : 0;
      }

      // Calculate total matches and percentages for sellToAnalysis and buyFromAnalysis
      this.sumAnalysisTotals(sellToAnalysis);
      this.sumAnalysisTotals(buyFromAnalysis);
    }


    // Matched NPAs and Total Unique NPAs (existing logic adjusted)
    const allFileNPAsSet = new Set([...file1NPAs, ...file2NPAs]);
    totalUniqueNPAs = allFileNPAsSet.size;
    const matchedNPAsSet = new Set<string>();
      if (file1Data.length > 0 && file2Data.length > 0) {
        const file2NpaMap = new Map<string, string[]>(); // NPANXX -> NPA
        file2Data.forEach(r => {
            if (!file2NpaMap.has(r.npanxx)) file2NpaMap.set(r.npanxx, []);
            file2NpaMap.get(r.npanxx)!.push(r.npa);
        });

        file1Data.forEach(r1 => {
            if (file2NpaMap.has(r1.npanxx)) {
                // An NPANXX match. Now check if NPA also matches.
                // This part of the logic for matchedNPAs might need review based on exact definition
                // For now, if NPANXX matches, consider the NPA from file1 as potentially matched.
                if (file2NpaMap.get(r1.npanxx)!.includes(r1.npa)) {
                     matchedNPAsSet.add(r1.npa);
                }
            }
        });
    }
    matchedNPAs = matchedNPAsSet.size;


    const report: USCodeReport = {
      file1: reportFile1,
      file2: reportFile2!, // Will be undefined if no file2, handle in UI
      matchedCodes,
      nonMatchedCodes,
      matchedCodesPercentage,
      nonMatchedCodesPercentage,
      matchedNPAs,
      totalUniqueNPAs,
      sellToAnalysis,
      buyFromAnalysis,
      zeroMarginDetail,
      totalComparableInterCodes,
      totalComparableIntraCodes,
    };
    return report;

  } catch (error) {
    console.error('[USService] Error generating US code report:', error);
    throw error; // Rethrow or handle as appropriate
  }
}

// Helper method to categorize margin into buckets
private categorizeMargin(margin: number, analysis: MarginAnalysis, type: 'inter' | 'intra') {
  const marginPercent = margin * 100;
  let bucket: MarginBucketDetail | null = null;

  if (marginPercent < 10) bucket = analysis.lessThan10;
  else if (marginPercent < 20) bucket = analysis.between10And20;
  else if (marginPercent < 30) bucket = analysis.between20And30;
  else if (marginPercent < 40) bucket = analysis.between30And40;
  else if (marginPercent < 50) bucket = analysis.between40And50;
  else if (marginPercent < 60) bucket = analysis.between50And60;
  else if (marginPercent < 70) bucket = analysis.between60And70;
  else if (marginPercent < 80) bucket = analysis.between70And80;
  else if (marginPercent < 90) bucket = analysis.between80And90;
  else if (marginPercent <= 100) bucket = analysis.between90And100; // Adjusted to include 100%
  else bucket = analysis.greaterThan100;

  if (bucket) {
    if (type === 'inter') bucket.matchInter++;
    else bucket.matchIntra++;
  }
}

// Helper method to calculate percentages for all buckets in an analysis
private calculateBucketPercentages(analysis: MarginAnalysis | undefined, totalComparableInter: number, totalComparableIntra: number) {
  if (!analysis) return;
  const buckets = [
    analysis.lessThan10, analysis.between10And20, analysis.between20And30,
    analysis.between30And40, analysis.between40And50, analysis.between50And60,
    analysis.between60And70, analysis.between70And80, analysis.between80And90,
    analysis.between90And100, analysis.greaterThan100
  ];

  for (const bucket of buckets) {
    bucket.percentInter = totalComparableInter > 0 ? (bucket.matchInter / totalComparableInter) * 100 : 0;
    bucket.percentIntra = totalComparableIntra > 0 ? (bucket.matchIntra / totalComparableIntra) * 100 : 0;
  }
}

// Helper method to sum total matches and percentages for an analysis
private sumAnalysisTotals(analysis: MarginAnalysis | undefined) {
    if (!analysis) return;
    analysis.totalInterMatches = 0;
    analysis.totalIntraMatches = 0;
    analysis.totalPercentInter = 0;
    analysis.totalPercentIntra = 0;

    const buckets = [
        analysis.lessThan10, analysis.between10And20, analysis.between20And30,
        analysis.between30And40, analysis.between40And50, analysis.between50And60,
        analysis.between60And70, analysis.between70And80, analysis.between80And90,
        analysis.between90And100, analysis.greaterThan100
    ];

    for (const bucket of buckets) {
        analysis.totalInterMatches += bucket.matchInter;
        analysis.totalIntraMatches += bucket.matchIntra;
        analysis.totalPercentInter += bucket.percentInter;
        analysis.totalPercentIntra += bucket.percentIntra;
    }
}

// Ensure calculateRateStats is available and correctly implemented
// private calculateRateStats(rates: number[]): RateStats { ... }
```

Key changes in `makeUsCodeReport`:

- Initialize `sellToAnalysis`, `buyFromAnalysis`, and `zeroMarginDetail`.
- Loop through `file1Data`, find corresponding `record2` in `file2Map`.
- For each matched NPANXX, calculate inter and intra-state margins.
  - **SELL TO Logic**: If `record1.rate < record2.rate`, margin is `(record2.rate - record1.rate) / record1.rate`.
  - **BUY FROM Logic**: If `record1.rate > record2.rate`, margin is `(record1.rate - record2.rate) / record1.rate`.
  - **0% Margin**: If rates are equal.
- Use `categorizeMargin` helper to increment counts in the correct bucket.
- After processing all records, use `calculateBucketPercentages` to compute percentages for each bucket based on `totalComparableInterCodes` and `totalComparableIntraCodes`.
- Use `sumAnalysisTotals` to calculate the total line for each analysis section.
- Populate these new analysis objects into the `USCodeReport` returned.
- `totalComparableInterCodes` and `totalComparableIntraCodes` are the denominators for percentage calculations (count of codes where both files had a comparable inter/intra rate).

## 4. UI Presentation (`client/src/components/us/USCodeReport.vue`)

The Vue component will need significant updates to display this new information.

```html
<template>
  <div class="overflow-x-auto">
    <div class="bg-gray-800 rounded-lg p-6 min-w-max">
      <!-- Changed to min-w-max for wider content -->
      <div v-if="report" class="space-y-8">
        <h2 class="text-xl text-white font-semibold">Code Report</h2>

        <!-- Comparison Section (Existing) - Can be kept or refactored -->
        <div
          v-if="isValidFileReport(report.file2)"
          class="rounded-lg overflow-hidden bg-gray-900/50"
        >
          <!-- ... existing comparison summary table ... -->
          <h2
            class="py-3 text-xl text-center text-fbWhite px-6 border-b border-gray-700"
          >
            <span class="text-accent">Overall Comparison</span>
          </h2>
          <div class="p-6">
            <table class="w-full">
              <tbody>
                <tr class="border-b border-gray-700">
                  <td class="py-2 font-medium text-gray-400">Matched Codes:</td>
                  <td class="py-2 text-right text-foreground">
                    {{ report.matchedCodes }} ({{
                    report.matchedCodesPercentage.toFixed(2) }}%)
                  </td>
                </tr>
                <tr class="border-b border-gray-700">
                  <td class="py-2 font-medium text-gray-400">
                    Non-Matched Codes:
                  </td>
                  <td class="py-2 text-right text-foreground">
                    {{ report.nonMatchedCodes }} ({{
                    report.nonMatchedCodesPercentage.toFixed(2) }}%)
                  </td>
                </tr>
                <tr
                  v-if="report.matchedNPAs !== undefined"
                  class="border-b border-gray-700"
                >
                  <td class="py-2 font-medium text-gray-400">
                    Matched Area Codes (NPAs):
                  </td>
                  <td class="py-2 text-right text-foreground">
                    {{ report.matchedNPAs }} of {{ report.totalUniqueNPAs }}
                  </td>
                </tr>
                <tr
                  v-if="report.matchedNPAs !== undefined && report.totalUniqueNPAs > 0"
                >
                  <td class="py-2 font-medium text-gray-400">
                    Area Code Match Percentage:
                  </td>
                  <td class="py-2 text-right text-foreground">
                    {{ ((report.matchedNPAs / report.totalUniqueNPAs) *
                    100).toFixed(2) }}%
                  </td>
                </tr>
                <tr
                  v-if="report.totalComparableInterCodes !== undefined"
                  class="border-b border-gray-700"
                >
                  <td class="py-2 font-medium text-gray-400">
                    Total Comparable Inter Codes:
                  </td>
                  <td class="py-2 text-right text-foreground">
                    {{ report.totalComparableInterCodes }}
                  </td>
                </tr>
                <tr v-if="report.totalComparableIntraCodes !== undefined">
                  <td class="py-2 font-medium text-gray-400">
                    Total Comparable Intra Codes:
                  </td>
                  <td class="py-2 text-right text-foreground">
                    {{ report.totalComparableIntraCodes }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 0% Margin Detail Section -->
        <div
          v-if="report.file2 && report.zeroMarginDetail"
          class="rounded-lg overflow-hidden bg-gray-900/50"
        >
          <h2
            class="py-3 text-xl text-center text-fbWhite px-6 border-b border-gray-700"
          >
            <span class="text-accent">0% Margin Matches</span>
            <span class="block text-sm text-gray-400">
              (Rates are identical in {{ report.file1.fileName }} and {{
              report.file2.fileName }})
            </span>
          </h2>
          <div class="p-6">
            <table class="w-full">
              <thead>
                <tr class="text-left text-gray-400 text-sm">
                  <th class="py-2 px-3">Rate Type</th>
                  <th class="py-2 px-3 text-right">Match Count</th>
                  <th class="py-2 px-3 text-right">% of Comparable</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-700">
                  <td class="py-2 px-3 font-medium text-gray-300">
                    Inter-State
                  </td>
                  <td class="py-2 px-3 text-right text-foreground">
                    {{ report.zeroMarginDetail.matchInter }}
                  </td>
                  <td class="py-2 px-3 text-right text-foreground">
                    {{ report.zeroMarginDetail.percentInter.toFixed(2) }}%
                  </td>
                </tr>
                <tr>
                  <td class="py-2 px-3 font-medium text-gray-300">
                    Intra-State
                  </td>
                  <td class="py-2 px-3 text-right text-foreground">
                    {{ report.zeroMarginDetail.matchIntra }}
                  </td>
                  <td class="py-2 px-3 text-right text-foreground">
                    {{ report.zeroMarginDetail.percentIntra.toFixed(2) }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SELL TO / BUY FROM Section -->
        <div
          v-if="report.file2 && (report.sellToAnalysis || report.buyFromAnalysis)"
          class="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <!-- SELL TO Column -->
          <div
            v-if="report.sellToAnalysis"
            class="rounded-lg overflow-hidden bg-gray-900/50"
          >
            <h2
              class="py-3 text-xl text-center text-fbWhite px-6 border-b border-gray-700"
            >
              <span class="text-accent">SELL TO</span>
              <span class="block text-sm text-gray-400">
                ({{ report.file1.fileName }} rate &lt; {{ report.file2.fileName
                }} rate)
              </span>
            </h2>
            <MarginAnalysisTable :analysis="report.sellToAnalysis" />
          </div>

          <!-- BUY FROM Column -->
          <div
            v-if="report.buyFromAnalysis"
            class="rounded-lg overflow-hidden bg-gray-900/50"
          >
            <h2
              class="py-3 text-xl text-center text-fbWhite px-6 border-b border-gray-700"
            >
              <span class="text-accent">BUY FROM</span>
              <span class="block text-sm text-gray-400">
                ({{ report.file1.fileName }} rate &gt; {{ report.file2.fileName
                }} rate)
              </span>
            </h2>
            <MarginAnalysisTable :analysis="report.buyFromAnalysis" />
          </div>
        </div>

        <!-- File Summaries (Existing USCodeSummary) - May need refactoring if structure changes significantly -->
        <!-- Consider if USCodeSummary is still appropriate or if its content should be integrated elsewhere -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <USCodeSummary
            v-if="isValidFileReport(report.file1)"
            :file-report="report.file1"
            :component-id="getComponentIdForFile(report.file1.fileName)"
          />
          <USCodeSummary
            v-if="isValidFileReport(report.file2)"
            :file-report="report.file2"
            :component-id="getComponentIdForFile(report.file2.fileName)"
          />
        </div>
      </div>
      <div v-else class="text-center text-xl text-muted-foreground">
        No code report data available. Generate a report to see details.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    type USCodeReport,
    type USFileReport,
    type MarginAnalysis,
  } from "@/types/domains/us-types";
  import USCodeSummary from "@/components/us/USCodeSummary.vue"; // Existing component
  import MarginAnalysisTable from "@/components/us/MarginAnalysisTable.vue"; // New component
  import { useUsStore } from "@/stores/us-store";

  const usStore = useUsStore();

  defineProps<{
    report: USCodeReport | null;
  }>();

  function isValidFileReport(fileReport: any): fileReport is USFileReport {
    return (
      fileReport && typeof fileReport === "object" && "fileName" in fileReport
    );
  }

  function getComponentIdForFile(fileName: string): "us1" | "us2" {
    // This helper function might need adjustment if store structure changes
    for (const [componentId, fileInfo] of usStore.filesUploaded.entries()) {
      if (fileInfo.fileName === fileName) {
        return componentId as "us1" | "us2";
      }
    }
    // console.warn(\`ComponentId not found for filename: \${fileName}\`); // Original console.warn
    return "us1"; // Default or error case
  }
</script>
```

### New Sub-Component: `client/src/components/us/MarginAnalysisTable.vue`

This component will render the table for "SELL TO" and "BUY FROM" analysis to keep `USCodeReport.vue` cleaner.

```html
<!-- client/src/components/us/MarginAnalysisTable.vue -->
<template>
  <div class="p-6">
    <table class="w-full text-sm">
      <thead>
        <tr class="text-left text-gray-400">
          <th class="py-2 px-2 font-medium">Margin</th>
          <th class="py-2 px-2 font-medium text-right">Match (Inter)</th>
          <th class="py-2 px-2 font-medium text-right">%</th>
          <th class="py-2 px-2 font-medium text-right">Match (Intra)</th>
          <th class="py-2 px-2 font-medium text-right">%</th>
        </tr>
      </thead>
      <tbody class="text-gray-300">
        <MarginAnalysisTableRow label="< 10%" :data="analysis.lessThan10" />
        <MarginAnalysisTableRow
          label="10% - 20%"
          :data="analysis.between10And20"
        />
        <MarginAnalysisTableRow
          label="20% - 30%"
          :data="analysis.between20And30"
        />
        <MarginAnalysisTableRow
          label="30% - 40%"
          :data="analysis.between30And40"
        />
        <MarginAnalysisTableRow
          label="40% - 50%"
          :data="analysis.between40And50"
        />
        <MarginAnalysisTableRow
          label="50% - 60%"
          :data="analysis.between50And60"
        />
        <MarginAnalysisTableRow
          label="60% - 70%"
          :data="analysis.between60And70"
        />
        <MarginAnalysisTableRow
          label="70% - 80%"
          :data="analysis.between70And80"
        />
        <MarginAnalysisTableRow
          label="80% - 90%"
          :data="analysis.between80And90"
        />
        <MarginAnalysisTableRow
          label="90% - 100%"
          :data="analysis.between90And100"
        />
        <MarginAnalysisTableRow
          label="> 100%"
          :data="analysis.greaterThan100"
        />
        <tr class="border-t-2 border-gray-700 font-semibold text-white">
          <td class="py-2 px-2">Total</td>
          <td class="py-2 px-2 text-right">{{ analysis.totalInterMatches }}</td>
          <td class="py-2 px-2 text-right">
            {{ analysis.totalPercentInter.toFixed(1) }}%
          </td>
          <td class="py-2 px-2 text-right">{{ analysis.totalIntraMatches }}</td>
          <td class="py-2 px-2 text-right">
            {{ analysis.totalPercentIntra.toFixed(1) }}%
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
  import { type MarginAnalysis } from "@/types/domains/us-types";
  import MarginAnalysisTableRow from "./MarginAnalysisTableRow.vue"; // Another new sub-component

  defineProps<{
    analysis: MarginAnalysis;
  }>();
</script>
```

### New Sub-Component: `client/src/components/us/MarginAnalysisTableRow.vue`

```html
<!-- client/src/components/us/MarginAnalysisTableRow.vue -->
<template>
  <tr class="border-b border-gray-700 last:border-b-0">
    <td class="py-2 px-2">{{ label }}</td>
    <td class="py-2 px-2 text-right text-foreground">{{ data.matchInter }}</td>
    <td class="py-2 px-2 text-right text-foreground">
      {{ data.percentInter.toFixed(1) }}%
    </td>
    <td class="py-2 px-2 text-right text-foreground">{{ data.matchIntra }}</td>
    <td class="py-2 px-2 text-right text-foreground">
      {{ data.percentIntra.toFixed(1) }}%
    </td>
  </tr>
</template>

<script setup lang="ts">
  import { type MarginBucketDetail } from "@/types/domains/us-types";

  defineProps<{
    label: string;
    data: MarginBucketDetail;
  }>();
</script>
```

**Key UI Points:**

- The main `USCodeReport.vue` will now have a two-column layout for "SELL TO" and "BUY FROM".
- A new section for "0% Margin" will be added.
- The `MarginAnalysisTable.vue` component is created to render the margin breakdown table, used by both "SELL TO" and "BUY FROM" sections.
- The `MarginAnalysisTableRow.vue` component is created for each row in the breakdown table.
- Ensure all numbers are formatted nicely (e.g., `toFixed(1)` or `toFixed(2)` for percentages).
- Use Tailwind CSS for styling, consistent with the application's theme.
- File names are used directly in headings to clarify which file is "ours" vs. "theirs" as per user inference.
- The existing `USCodeSummary` components can remain if their content is still relevant as individual file summaries.

## Summary of New Files/Major Changes:

1.  **`client/src/types/domains/us-types.ts`**: Heavily modified with new interfaces.
2.  **`client/src/services/us.service.ts`**: `makeUsCodeReport` and helper methods significantly updated.
3.  **`client/src/components/us/USCodeReport.vue`**: Template significantly updated to include new sections and use new sub-components.
4.  **`client/src/components/us/MarginAnalysisTable.vue`**: New component.
5.  **`client/src/components/us/MarginAnalysisTableRow.vue`**: New component.
6.  **`client/src/stores/us-store.ts`**: No structural code change, but will use the updated `USCodeReport` type.

This plan provides a comprehensive approach to implementing the requested feature.
Each step should be tested thoroughly, especially the calculations in `us.service.ts` and the data flow to the UI components.
Consider edge cases, such as when one or both files are empty or when no matches are found.
The definition of `totalComparableInterCodes` and `totalComparableIntraCodes` is crucial for correct percentage calculations.
The `coveragePercentage` in `USFileReport` needs clarification or to be removed if not used.
The logic for `matchedNPAs` might need refinement based on the exact business rule for what constitutes an NPA match in the context of NPANXX matching.
The current `getComponentIdForFile` in `USCodeReport.vue` might need a safer default or error handling if a filename doesn't map to `us1` or `us2`.
Final check on `toFixed()` usage for percentages; the image shows `2.3%`, so `toFixed(1)` is used in the plan, adjust if `toFixed(2)` is preferred for more precision.
The "Total" row percentages in the image (12.6%, 10.8%) are sums of the individual bucket percentages; this is replicated by summing `bucket.percentInter/Intra` in `sumAnalysisTotals`.
The user mentioned `min-w-content` was an issue, so `min-w-max` is suggested for the main container in `USCodeReport.vue` to allow for wider tables if needed.
The order of sections in `USCodeReport.vue` has been rearranged to: Overall Comparison, 0% Margin, then Sell To/Buy From, followed by individual file summaries.
The `SELL TO` and `BUY FROM` subheadings now clarify the rate comparison (e.g., `File1_Rate < File2_Rate`).
The `MarginAnalysisTableRow.vue` uses `last:border-b-0` to remove the bottom border from the last data row before the "Total" row.
The "Total" row in `MarginAnalysisTable.vue` is styled to be bold and uses `border-t-2` for separation.
A small fix to the `categorizeMargin` logic: `marginPercent <= 100` for the `90-100%` bucket to correctly include 100%.
The `BUY FROM` margin calculation is `(Rate_File1 - Rate_File2) / Rate_File1` if `Rate_File1 > Rate_File2`, making it a positive percentage representing how much "cheaper" File 1 is for buying purposes, relative to File 1's rate. If the margin needs to be relative to File 2 for "BUY FROM", that calculation would need to be `(Rate_File1 - Rate_File2) / Rate_File2`. The current plan uses File 1 as the base for both calculations for consistency. This should be confirmed if there's any ambiguity. The user's previous clarification: "If the opposite is true - then that should be considered a BUY FROM and that count should be included for the appropriate margin calculation." This implies the margin is still calculated in a way that fits the positive buckets, so `(Rate_File1 - Rate_File2) / Rate_File1` when `Rate_File1 > Rate_File2` will give a positive percentage.
Corrected the console.warn in `USCodeReport.vue`'s `getComponentIdForFile` to use backticks for the template literal.

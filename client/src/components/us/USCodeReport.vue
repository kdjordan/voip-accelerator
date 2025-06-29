<template>
  <div class="overflow-x-auto">
    <div class="bg-gray-800 rounded-lg p-6 w-full">
      <!-- Changed from min-w-max to w-full to prevent expansion -->
      <div v-if="props.report" class="space-y-8">
        <!-- +1 Destination Quality Analysis Section -->
        <div v-if="plusOneAnalysis?.hasIssues" class="mb-8">
          <h4 class="text-lg text-fbWhite font-medium mb-4 uppercase ml-2">
            ⚠️ Rate Deck Quality Analysis
          </h4>
          <div class="p-6 rounded-lg overflow-hidden bg-red-900/20 border border-red-500/30">
            <div class="mb-4">
              <p class="text-red-300 font-medium">
                Warning: This rate deck contains expensive +1 destinations that may increase costs significantly.
              </p>
            </div>
            
            <!-- Caribbean NPAs -->
            <div v-if="plusOneAnalysis.caribbeanAnalysis.count > 0" class="mb-6">
              <h5 class="text-red-400 font-medium mb-2">
                Caribbean Territories ({{ plusOneAnalysis.caribbeanAnalysis.count }} NPAs, {{ plusOneAnalysis.caribbeanAnalysis.totalRecords }} records)
              </h5>
              <div class="bg-red-950/30 p-3 rounded">
                <div class="mb-2">
                  <span class="text-gray-400 text-sm">NPAs:</span>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span 
                      v-for="npa in plusOneAnalysis.caribbeanAnalysis.npas" 
                      :key="npa"
                      class="bg-red-600/20 text-red-300 px-2 py-1 rounded text-xs"
                    >
                      {{ npa }}
                    </span>
                  </div>
                </div>
                <div v-if="plusOneAnalysis.caribbeanAnalysis.examples.length > 0">
                  <span class="text-gray-400 text-sm">Example codes:</span>
                  <div class="text-red-300 text-xs mt-1">
                    {{ plusOneAnalysis.caribbeanAnalysis.examples.slice(0, 10).join(', ') }}
                    <span v-if="plusOneAnalysis.caribbeanAnalysis.examples.length > 10">...</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pacific NPAs -->
            <div v-if="plusOneAnalysis.pacificAnalysis.count > 0" class="mb-4">
              <h5 class="text-orange-400 font-medium mb-2">
                Pacific Territories ({{ plusOneAnalysis.pacificAnalysis.count }} NPAs, {{ plusOneAnalysis.pacificAnalysis.totalRecords }} records)
              </h5>
              <div class="bg-orange-950/30 p-3 rounded">
                <div class="mb-2">
                  <span class="text-gray-400 text-sm">NPAs:</span>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span 
                      v-for="npa in plusOneAnalysis.pacificAnalysis.npas" 
                      :key="npa"
                      class="bg-orange-600/20 text-orange-300 px-2 py-1 rounded text-xs"
                    >
                      {{ npa }}
                    </span>
                  </div>
                </div>
                <div v-if="plusOneAnalysis.pacificAnalysis.examples.length > 0">
                  <span class="text-gray-400 text-sm">Example codes:</span>
                  <div class="text-orange-300 text-xs mt-1">
                    {{ plusOneAnalysis.pacificAnalysis.examples.slice(0, 10).join(', ') }}
                    <span v-if="plusOneAnalysis.pacificAnalysis.examples.length > 10">...</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="text-yellow-300 text-sm mt-4 p-3 bg-yellow-900/20 rounded">
              💡 <strong>Recommendation:</strong> Consider filtering out these expensive destinations or negotiate special rates for Caribbean/Pacific territories.
            </div>
          </div>
        </div>

        <!-- Safe Rate Deck Confirmation -->
        <div v-if="plusOneAnalysis && !plusOneAnalysis.hasIssues" class="mb-8">
          <div class="p-4 rounded-lg bg-green-900/20 border border-green-500/30">
            <div class="flex items-center">
              <span class="text-green-400 text-lg mr-2">✅</span>
              <span class="text-green-300 font-medium">Clean Rate Deck</span>
            </div>
            <p class="text-green-200 text-sm mt-1">
              No expensive Caribbean or Pacific territories detected. This appears to be a standard US/Canada rate deck.
            </p>
            <div class="text-green-300 text-xs mt-2">
              US NPAs: {{ plusOneAnalysis.usAnalysis.count }} | Canadian NPAs: {{ plusOneAnalysis.canadianAnalysis.count }}
            </div>
          </div>
        </div>

        <!-- Comparison Section (Existing) -->
        <div v-if="isValidFileReport(props.report.file2)">
          <h4 class="text-lg text-fbWhite font-medium mb-4 uppercase ml-2">Overall Comparison</h4>
          <div class="p-6 rounded-lg overflow-hidden bg-gray-900/50">
            <table class="w-full">
              <tbody>
                <tr class="border-b border-gray-700">
                  <td class="py-2 font-medium text-gray-400">Matched Codes:</td>
                  <td class="py-2 text-right text-foreground">
                    {{ props.report.matchedCodes }} ({{ props.report.matchedCodesPercentage.toFixed(2) }}%)
                  </td>
                </tr>
                <tr class="border-b border-gray-700">
                  <td class="py-2 font-medium text-gray-400">Non-Matched Codes:</td>
                  <td class="py-2 text-right text-foreground">
                    {{ props.report.nonMatchedCodes }} ({{
                      props.report.nonMatchedCodesPercentage.toFixed(2)
                    }}%)
                  </td>
                </tr>
                <tr v-if="props.report.matchedNPAs !== undefined" class="border-b border-gray-700">
                  <td class="py-2 font-medium text-gray-400">Matched Area Codes (NPAs):</td>
                  <td class="py-2 text-right text-foreground">
                    {{ props.report.matchedNPAs }} of {{ props.report.totalUniqueNPAs }}
                  </td>
                </tr>
                <tr
                  v-if="props.report.matchedNPAs !== undefined && props.report.totalUniqueNPAs > 0"
                  class="border-b border-gray-700"
                >
                  <td class="py-2 font-medium text-gray-400">Area Code Match Percentage:</td>
                  <td class="py-2 text-right text-foreground">
                    {{ ((props.report.matchedNPAs / props.report.totalUniqueNPAs) * 100).toFixed(2) }}%
                  </td>
                </tr>
                <tr
                  v-if="props.report.totalComparableInterCodes !== undefined"
                  class="border-b border-gray-700"
                >
                  <td class="py-2 font-medium text-gray-400">Total Comparable Inter Codes:</td>
                  <td class="py-2 text-right text-foreground">
                    {{ props.report.totalComparableInterCodes }}
                  </td>
                </tr>
                <tr v-if="props.report.totalComparableIntraCodes !== undefined">
                  <td class="py-2 font-medium text-gray-400">Total Comparable Intra Codes:</td>
                  <td class="py-2 text-right text-foreground">
                    {{ props.report.totalComparableIntraCodes }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 0% Margin Detail Section -->
        <div v-if="props.report.file2 && props.report.zeroMarginDetail">
          <h4 class="text-lg text-fbWhite font-medium mb-4 uppercase ml-2">
            0% Margin Matches
            <span class="block text-sm text-gray-400">
              Rates are identical in {{ props.report.file1.fileName }} and {{ props.report.file2.fileName }}
            </span>
          </h4>
          <div class="p-6 rounded-lg overflow-hidden bg-gray-900/50">
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
                  <td class="py-2 px-3 font-medium text-gray-300">Inter-State</td>
                  <td class="py-2 px-3 text-right text-foreground">
                    {{ props.report.zeroMarginDetail.matchInter }}
                  </td>
                  <td class="py-2 px-3 text-right text-foreground">
                    {{ props.report.zeroMarginDetail.percentInter.toFixed(2) }}%
                  </td>
                </tr>
                <tr>
                  <td class="py-2 px-3 font-medium text-gray-300">Intra-State</td>
                  <td class="py-2 px-3 text-right text-foreground">
                    {{ props.report.zeroMarginDetail.matchIntra }}
                  </td>
                  <td class="py-2 px-3 text-right text-foreground">
                    {{ props.report.zeroMarginDetail.percentIntra.toFixed(2) }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SELL TO / BUY FROM Section -->
        <div
          v-if="props.report.file2 && (props.report.sellToAnalysis || props.report.buyFromAnalysis)"
          class="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <!-- SELL TO Column -->
          <div v-if="props.report.sellToAnalysis" class="rounded-lg overflow-hidden">
            <h4 class="text-lg text-fbWhite font-medium mb-4 uppercase ml-2">
              SELL TO
              <span class="block text-sm text-gray-400">
                {{ props.report.file1.fileName }} <span class="lowercase">rate</span> &lt;
                {{ props.report.file2.fileName }} <span class="lowercase">rate</span>
              </span>
            </h4>
            <MarginAnalysisTable :analysis="props.report.sellToAnalysis" />
          </div>

          <!-- BUY FROM Column -->
          <div v-if="props.report.buyFromAnalysis" class="rounded-lg overflow-hidden">
            <h4 class="text-lg text-fbWhite font-medium mb-4 uppercase ml-2">
              BUY FROM
              <span class="block text-sm text-gray-400">
                {{ props.report.file1.fileName }} <span class="lowercase">rate</span> &gt;
                {{ props.report.file2.fileName }} <span class="lowercase">rate</span>
              </span>
            </h4>
            <MarginAnalysisTable :analysis="props.report.buyFromAnalysis" />
          </div>
        </div>
      </div>
      <div v-else class="text-center text-xl text-muted-foreground">
        No code report data available. Generate a report to see details.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import {
    type USCodeReport,
    type USFileReport,
    type MarginAnalysis,
    type USStandardizedData,
  } from '@/types/domains/us-types';
  import USCodeSummary from '@/components/us/USCodeSummary.vue';
  import MarginAnalysisTable from '@/components/us/MarginAnalysisTable.vue';
  import { useUsStore } from '@/stores/us-store';
  import { USService } from '@/services/us.service';
  import { NANPCategorizer } from '@/utils/nanp-categorization';

  const usStore = useUsStore();
  const usService = new USService();

  const props = defineProps<{
    report: USCodeReport | null;
  }>();
  
  // Enhanced +1 Analysis state - analyzes ALL data, not just preview
  const plusOneAnalysis = ref<{
    hasIssues: boolean;
    caribbeanAnalysis: {
      count: number;
      npas: string[];
      totalRecords: number;
      examples: string[];
    };
    pacificAnalysis: {
      count: number;
      npas: string[];
      totalRecords: number;
      examples: string[];
    };
    usAnalysis: {
      count: number;
      npas: string[];
      totalRecords: number;
    };
    canadianAnalysis: {
      count: number;
      npas: string[];
      totalRecords: number;
    };
  } | null>(null);
  
  // Analyze +1 destinations when report changes
  watch(
    () => props.report,
    (newReport) => {
      if (!newReport) {
        plusOneAnalysis.value = null;
        return;
      }
      
      try {
        console.log('[USCodeReport] Starting comprehensive +1 analysis...');
        
        // Collect all NPAs from both uploaded files
        const allNPAs = new Map<string, {
          npa: string;
          category: string;
          confidence: string;
          totalRecords: number;
          examples: string[];
        }>();
        
        // Analyze file 1 - Get data from US store instead of service
        if (newReport.file1?.fileName) {
          const file1ComponentId = getComponentIdForFile(newReport.file1.fileName);
          const file1Data = usStore.getFileDataByComponent(file1ComponentId);
          console.log(`[USCodeReport] Analyzing file 1: ${newReport.file1.fileName}, records: ${file1Data.length}`);
          
          for (const record of file1Data) {
            if (!allNPAs.has(record.npa)) {
              const categorization = NANPCategorizer.categorizeNPA(record.npa);
              allNPAs.set(record.npa, {
                npa: record.npa,
                category: categorization.category,
                confidence: categorization.confidence,
                totalRecords: 0,
                examples: []
              });
            }
            
            const npaData = allNPAs.get(record.npa)!;
            npaData.totalRecords++;
            
            // Add NPANXX examples (limit to prevent memory issues)
            if (npaData.examples.length < 10) {
              npaData.examples.push(record.npanxx);
            }
          }
        }
        
        // Analyze file 2 if present - Get data from US store instead of service
        if (newReport.file2?.fileName) {
          const file2ComponentId = getComponentIdForFile(newReport.file2.fileName);
          const file2Data = usStore.getFileDataByComponent(file2ComponentId);
          console.log(`[USCodeReport] Analyzing file 2: ${newReport.file2.fileName}, records: ${file2Data.length}`);
          
          for (const record of file2Data) {
            if (!allNPAs.has(record.npa)) {
              const categorization = NANPCategorizer.categorizeNPA(record.npa);
              allNPAs.set(record.npa, {
                npa: record.npa,
                category: categorization.category,
                confidence: categorization.confidence,
                totalRecords: 0,
                examples: []
              });
            }
            
            const npaData = allNPAs.get(record.npa)!;
            npaData.totalRecords++;
            
            // Add NPANXX examples
            if (npaData.examples.length < 10 && !npaData.examples.includes(record.npanxx)) {
              npaData.examples.push(record.npanxx);
            }
          }
        }
        
        // Categorize all NPAs
        const caribbeanNPAs: string[] = [];
        const pacificNPAs: string[] = [];
        const usNPAs: string[] = [];
        const canadianNPAs: string[] = [];
        
        let caribbeanRecords = 0;
        let pacificRecords = 0;
        let usRecords = 0;
        let canadianRecords = 0;
        
        const caribbeanExamples: string[] = [];
        const pacificExamples: string[] = [];
        
        for (const [npa, data] of allNPAs) {
          switch (data.category) {
            case 'caribbean':
              caribbeanNPAs.push(npa);
              caribbeanRecords += data.totalRecords;
              caribbeanExamples.push(...data.examples);
              break;
            case 'pacific':
              pacificNPAs.push(npa);
              pacificRecords += data.totalRecords;
              pacificExamples.push(...data.examples);
              break;
            case 'us-domestic':
              usNPAs.push(npa);
              usRecords += data.totalRecords;
              break;
            case 'canadian':
              canadianNPAs.push(npa);
              canadianRecords += data.totalRecords;
              break;
          }
        }
        
        const hasIssues = caribbeanNPAs.length > 0 || pacificNPAs.length > 0;
        
        plusOneAnalysis.value = {
          hasIssues,
          caribbeanAnalysis: {
            count: caribbeanNPAs.length,
            npas: caribbeanNPAs.sort(),
            totalRecords: caribbeanRecords,
            examples: [...new Set(caribbeanExamples)].sort()
          },
          pacificAnalysis: {
            count: pacificNPAs.length,
            npas: pacificNPAs.sort(),
            totalRecords: pacificRecords,
            examples: [...new Set(pacificExamples)].sort()
          },
          usAnalysis: {
            count: usNPAs.length,
            npas: usNPAs.sort(),
            totalRecords: usRecords
          },
          canadianAnalysis: {
            count: canadianNPAs.length,
            npas: canadianNPAs.sort(),
            totalRecords: canadianRecords
          }
        };
        
        console.log('[USCodeReport] +1 Analysis complete:', {
          totalNPAs: allNPAs.size,
          caribbeanNPAs: caribbeanNPAs.length,
          pacificNPAs: pacificNPAs.length,
          hasIssues,
          analysisResult: plusOneAnalysis.value
        });
        
      } catch (error) {
        console.error('[USCodeReport] Error analyzing +1 destinations:', error);
        plusOneAnalysis.value = null;
      }
    },
    { immediate: true }
  );

  function isValidFileReport(fileReport: any): fileReport is USFileReport {
    return fileReport && typeof fileReport === 'object' && 'fileName' in fileReport;
  }

  function getComponentIdForFile(fileName: string): 'us1' | 'us2' {
    // This helper function might need adjustment if store structure changes
    for (const [componentId, fileInfo] of usStore.filesUploaded.entries()) {
      if (fileInfo.fileName === fileName) {
        return componentId as 'us1' | 'us2';
      }
    }
    console.warn(`ComponentId not found for filename: ${fileName}`);
    return 'us1'; // Default or error case
  }
</script>

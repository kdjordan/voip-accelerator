# VOIP Rate Analysis Service Implementation Plan

## Phase 1: File Upload System (Fundamentals)

- [x] Create upload UI components for US and AZ rate files
- [x] Implement file validation (CSV format)
- [x] Add drag-and-drop functionality
- [x] Implement preview modal to validate file content
- [x] Build column mapping interface for different file formats
- [x] Create storage mechanism in Pinia store
- [x] Fix US file upload component to properly store files in the Pinia store

## Phase 2: Data Processing & Basic Analysis

- [x] Implement basic rate file analysis:
  - [x] Count total NPA-NXX codes in each file
  - [x] Extract unique NPAs (area codes)
  - [x] Calculate rate statistics (min, max, avg) for each file - including interstate, intrastate, and indeterminate rates.
  - [x] Display summary of single file analysis
- [x] Create basic data visualization components

## Phase 2.5: LERG Data Management Refactoring

- [ ] Refactor LERG data storage to use Pinia instead of IndexedDB:
  - [ ] Modify `lerg-store.ts` to store NPA-focused LERG dataset
  - [ ] Update data loading mechanism in `UsView.vue` to populate Pinia store directly
  - [ ] Create comprehensive getters in `lerg-store.ts` for NPA and state-level queries
  - [ ] Add type definitions for all LERG data structures
  - [ ] Maintain the current PostgreSQL fetch API (for future Supabase compatibility)
- [ ] Create service layer for accessing LERG data:
  - [ ] Implement caching strategy for frequently accessed data
  - [ ] Add helper functions for common LERG lookups (NPA validation, country/state mapping)
  - [ ] Ensure compatibility with Web Workers for comparison operations
- [ ] Design for modularity:
  - [ ] Create architecture that allows for future NPA population data integration
  - [ ] Implement flexible filtering and sorting capabilities

### Technical Implementation Details

1. **Store Structure Focus:**

   - Expand the `LergState` interface in `lerg-store.ts` to focus on NPA-level data
   - Organize data hierarchically by Country → State → NPA for efficient lookup
   - Design for extension with future population density data

2. **Data Loading Refactoring:**

   - Modify `lerg-facade.service.ts` to load data directly into Pinia store
   - Remove Dexie/IndexedDB dependencies while maintaining the same API interface
   - Keep the current initialization sequence in `UsView.vue` but update the target storage

3. **Worker Communication Strategy:**

   - Use `postMessage` to pass minimal required LERG data to the comparison worker
   - Create a streamlined country/state/NPA mapping for efficient transfer to Web Workers
   - Implement data request patterns for workers to request specific LERG lookups

4. **Performance Optimizations:**

   - Pre-compute common lookup patterns (NPA→State, State→NPAs)
   - Design data structures for country-level organization (US, Canada, Other)
   - Implement lazy loading for detailed LERG data

5. **API Compatibility Layer:**
   - Create an abstract `LergDataProvider` interface
   - Implement a `PiniaLergDataProvider` that reads from the store
   - Future: Implement a `SupabaseLergDataProvider` with the same interface

### Integration with Comparison Workers

1. **Enhanced US and Canada Pricing Reports:**

   - Add jurisdictional analytics to pricing reports by associating NPAs with states/provinces
   - Calculate country and state-level pricing averages for high-level insights
   - Highlight non-US/Canada NPAs for awareness

2. **Efficient Data Transfer to Workers:**

   - Create a minimal LERG dataset focused on NPA→Country→State mappings for worker operations
   - Implement a streamlined JSON structure for efficient transfer to Web Workers
   - Add lookup methods in workers to validate NPAs against LERG data

3. **Cross-reference with Rate Sheets:**

   - Identify invalid or outdated NPAs in rate sheets by comparing with LERG data
   - Flag invalid rows during import with clear error messages
   - Calculate coverage metrics (what percentage of valid NPAs are covered)

4. **Visualization Enhancements:**
   - Create country and state-level visualizations of pricing patterns
   - Implement interactive filtering by country/state for comparison reports
   - Design for future integration with population density data

## Phase 3: File Comparison Features

- [ ] Complete comparison between two uploaded files:
  - [x] Create worker architecture for US code reports and comparison
  - [x] Implement enhanced code report with country and state breakdowns
  - [x] Create initial pricing report with rate comparisons
  - [ ] Utilize LERG data from Pinia store for enhanced comparisons
  - [ ] Identify overlapping NPAs between files
  - [ ] Calculate gaps (codes in one file but not the other)
  - [ ] Create rate difference statistics by country and state
  - [ ] Calculate percentage differences
  - [ ] Implement jurisdictional classification using LERG data
- [ ] Build comparison visualization components
- [ ] Implement filtering by:
  - [ ] Rate differences (higher/lower)
  - [ ] NPA (area code)
  - [ ] Country/state
  - [ ] Rate ranges

## Phase 4: Advanced Features

- [ ] Add jurisdictional analysis:
  - [ ] Map NPAs to states/regions using LERG data
  - [ ] Calculate state-level pricing statistics
  - [ ] Create regional visualization
  - [ ] Implement rate center mapping
- [ ] LERG integration enhancements:
  - [ ] Validate NPA-NXX combinations against LERG
  - [ ] Flag invalid or outdated codes
  - [ ] Display comprehensive rate center information
- [ ] Performance optimizations for large files

## Phase 5: Backend Integration (Supabase)

- [ ] Implement Supabase integration:
  - [ ] Set up authentication and user management
  - [ ] Migrate LERG data access from local PostgreSQL to Supabase
  - [ ] Maintain local caching in Pinia store for performance
  - [ ] Add user preferences and saved analyses
- [ ] Implement data synchronization:
  - [ ] Create mechanisms for LERG data updates
  - [ ] Add versioning for LERG datasets
  - [ ] Implement selective data syncing to minimize bandwidth

## Phase 6: Reporting & Export

- [ ] Create comprehensive report interface:
  - [ ] Summary section
  - [ ] Pricing analysis
  - [ ] Code coverage analysis
  - [ ] Jurisdictional breakdown
- [ ] Implement export functionality:
  - [ ] Export comparison to CSV
  - [ ] Export visualization data
  - [ ] Generate PDF reports

## Phase 7: UI/UX Refinements

- [ ] Add progress indicators for long operations
- [ ] Implement contextual help and tooltips
- [ ] Create onboarding guide for first-time users
- [ ] Add responsive design for different device sizes
- [ ] Implement user preferences/settings

## Phase 8: Testing & Optimization

- [ ] Comprehensive testing with large files
- [ ] Browser compatibility testing
- [ ] Performance profiling and optimization
- [ ] User acceptance testing

## Immediate Next Steps

1. Begin LERG data storage refactoring (Phase 2.5)
2. Update the US pricing report worker to utilize LERG data from the Pinia store
3. Implement country and state-level analysis in the comparison reports

## First Implementation Steps

1. **Update `lerg-store.ts`**:

   ```typescript
   // Add to LergState interface
   export interface LergState {
     // Existing properties...
     npaRecords: Map<string, LERGRecord>; // Fast lookup by NPA
     countriesMap: Map<string, Set<string>>; // Country to NPAs mapping
     countryStateMap: Map<string, Map<string, Set<string>>>; // Country to state to NPAs
   }

   // Add new actions
   actions: {
     // Existing actions...

     setNpaRecords(npaRecords: Map<string, LERGRecord>) {
       this.npaRecords = npaRecords;
     },

     setCountriesMap(countriesMap: Map<string, Set<string>>) {
       this.countriesMap = countriesMap;
     },

     setCountryStateMap(countryStateMap: Map<string, Map<string, Set<string>>>) {
       this.countryStateMap = countryStateMap;
     }
   },

   // Add new getters
   getters: {
     // Existing getters...

     // Get LERG record by NPA
     getLergRecordByNPA: (state) => (npa: string) => {
       return state.npaRecords.get(npa);
     },

     // Get state code by NPA
     getStateByNPA: (state) => (npa: string) => {
       // Check each country and then each state within that country
       for (const [country, stateMap] of state.countryStateMap.entries()) {
         for (const [stateCode, npas] of stateMap.entries()) {
           if (npas.has(npa)) {
             return { country, state: stateCode };
           }
         }
       }
       return null;
     },

     // Get country by NPA
     getCountryByNPA: (state) => (npa: string) => {
       for (const [country, npas] of state.countriesMap.entries()) {
         if (npas.has(npa)) {
           return country;
         }
       }
       return null;
     },

     // Get all NPAs for a country
     getNpasByCountry: (state) => (country: string) => {
       return state.countriesMap.get(country) || new Set<string>();
     },

     // Get all NPAs for a state within a country
     getNpasByState: (state) => (country: string, stateCode: string) => {
       return state.countryStateMap.get(country)?.get(stateCode) || new Set<string>();
     },

     // Check if an NPA is valid
     isValidNPA: (state) => (npa: string) => {
       return state.npaRecords.has(npa);
     }
   }
   ```

2. **Update `lerg-facade.service.ts`**:

   ```typescript
   // Modify initialize method
   public async initialize(forceRefresh = false): Promise<OperationResult> {
     // ... existing initialization code ...

     try {
       // Get data from API (remains the same)
       const apiResult = await lergApiService.getLergData(forceRefresh);

       if (apiResult.status === OperationStatus.SUCCESS && apiResult.data) {
         const { data, stats } = apiResult.data;

         // Process the data
         const stateNPAs: StateNPAMapping = {};
         const npaRecords = new Map<string, LERGRecord>();
         const countriesMap = new Map<string, Set<string>>();
         const countryStateMap = new Map<string, Map<string, Set<string>>>();

         // Process data and populate maps
         data.forEach(record => {
           const { npa, state, country } = record;

           // Store in NPA records map
           npaRecords.set(npa, record);

           // Group by state
           if (!stateNPAs[state]) {
             stateNPAs[state] = [];
           }
           if (!stateNPAs[state].includes(npa)) {
             stateNPAs[state].push(npa);
           }

           // Group by country
           if (!countriesMap.has(country)) {
             countriesMap.set(country, new Set<string>());
           }
           countriesMap.get(country)!.add(npa);

           // Group by country and state
           if (!countryStateMap.has(country)) {
             countryStateMap.set(country, new Map<string, Set<string>>());
           }

           const stateMap = countryStateMap.get(country)!;
           if (!stateMap.has(state)) {
             stateMap.set(state, new Set<string>());
           }

           stateMap.get(state)!.add(npa);
         });

         // Update store directly instead of IndexedDB
         const lergStore = useLergStore();
         lergStore.setStateNPAs(stateNPAs);
         lergStore.setNpaRecords(npaRecords);
         lergStore.setCountriesMap(countriesMap);
         lergStore.setCountryStateMap(countryStateMap);
         lergStore.setLergStats(stats.totalRecords, stats.lastUpdated);
         lergStore.setLergLocallyStored(true);

         // Mark operation as successful
         this.setOperationStatus('initialize', OperationStatus.SUCCESS);
         return {
           status: OperationStatus.SUCCESS,
           message: `LERG data successfully loaded with ${stats.totalRecords} records`,
         };
       }

       // ... error handling (remains the same) ...
     } catch (error) {
       // ... error handling (remains the same) ...
     }
   }
   ```

3. **Update `us-comparison.worker.ts`**:

   ```typescript
   // Add handling for LERG data

   // Define a lightweight LERG data structure for worker use
   interface LergWorkerData {
     validNpas: Set<string>; // Set of valid NPAs
     npaMappings: Record<string, { country: string; state: string }>; // NPA to country/state mapping
     countryGroups: Record<string, string[]>; // Country to NPAs mapping
   }

   // Store LERG data in worker scope
   let lergData: LergWorkerData | null = null;

   // Listen for messages including LERG data
   self.addEventListener("message", (event) => {
     if (event.data.lergData) {
       // Store LERG data for use in comparisons
       lergData = event.data.lergData;
       self.postMessage({ status: "lergDataReceived" });
       return;
     }

     // Process normal comparison requests
     // Normalize input data for consistent processing
     const normalizedInput = normalizeInputData(event.data);

     try {
       // Process comparison and generate reports with LERG data
       const { pricingReport, codeReport } = generateReports(normalizedInput);

       // Send the generated reports back to the main thread
       self.postMessage({ pricingReport, codeReport });
     } catch (error) {
       console.error("Error generating reports:", error);
       self.postMessage({
         error: error instanceof Error ? error.message : String(error),
       });
     }
   });

   // Use LERG data in processing
   function generateReports(input: USReportsInput): {
     pricingReport: USPricingReport;
     codeReport: USCodeReport;
   } {
     // ... existing code ...

     // Flag invalid NPAs
     const invalidNpasFile1: string[] = [];
     const invalidNpasFile2: string[] = [];

     if (lergData) {
       // Validate NPAs in file 1
       file1Data.forEach((entry) => {
         if (!lergData?.validNpas.has(entry.npa)) {
           invalidNpasFile1.push(entry.npa);
         }
       });

       // Validate NPAs in file 2
       file2Data.forEach((entry) => {
         if (!lergData?.validNpas.has(entry.npa)) {
           invalidNpasFile2.push(entry.npa);
         }
       });

       // Group by country and state using NPA mappings
       const countryStateRates: Record<string, Record<string, number[]>> = {};

       // Process countries first (US and Canada get special focus)
       ["US", "CA"].forEach((countryCode) => {
         countryStateRates[countryCode] = {};
       });

       // Process file1 data by country and state
       file1Data.forEach((entry) => {
         const npa = entry.npa;
         const mapping = lergData?.npaMappings[npa];

         if (mapping) {
           const { country, state } = mapping;

           // Initialize country if needed
           if (!countryStateRates[country]) {
             countryStateRates[country] = {};
           }

           // Initialize state if needed
           if (!countryStateRates[country][state]) {
             countryStateRates[country][state] = [];
           }

           // Add rate data
           countryStateRates[country][state].push(entry.interRate);
         }
       });

       // Calculate country and state averages
       const countryRateAverages: Record<string, number> = {};
       const stateRateAverages: Record<string, Record<string, number>> = {};

       Object.entries(countryStateRates).forEach(([country, states]) => {
         stateRateAverages[country] = {};
         let countryRates: number[] = [];

         Object.entries(states).forEach(([state, rates]) => {
           stateRateAverages[country][state] =
             rates.reduce((sum, rate) => sum + rate, 0) / rates.length;

           // Add to country rates for country average
           countryRates = [...countryRates, ...rates];
         });

         // Calculate country average
         if (countryRates.length > 0) {
           countryRateAverages[country] =
             countryRates.reduce((sum, rate) => sum + rate, 0) /
             countryRates.length;
         }
       });

       // Add to report
       pricingReport.jurisdictionalAnalysis = {
         countryAverages: countryRateAverages,
         stateAverages: stateRateAverages,
         invalidNpas: {
           file1: invalidNpasFile1,
           file2: invalidNpasFile2,
         },
       };
     }

     return { pricingReport, codeReport };
   }
   ```

4. **Update `USPricingReport.vue`**:

   ```vue
   <template>
     <!-- Existing content -->

     <!-- Jurisdictional Breakdown -->
     <div v-if="report?.jurisdictionalAnalysis" class="space-y-6 mt-6">
       <!-- Country Breakdown Section -->
       <div class="bg-gray-800 p-6 rounded-lg">
         <h2 class="text-xl text-white font-semibold mb-4">
           Country Rate Analysis
         </h2>

         <div class="grid grid-cols-2 gap-4">
           <div
             v-for="(avg, country) in report.jurisdictionalAnalysis
               .countryAverages"
             :key="country"
             class="bg-gray-900/50 p-4 rounded-lg"
           >
             <div class="text-lg text-accent font-semibold">
               {{ getCountryName(country) }}
             </div>
             <div class="text-white text-xl">${{ avg.toFixed(4) }}</div>
           </div>
         </div>
       </div>

       <!-- US States Section -->
       <div
         v-if="report.jurisdictionalAnalysis.stateAverages?.US"
         class="bg-gray-800 p-6 rounded-lg"
       >
         <h2 class="text-xl text-white font-semibold mb-4">
           US States Analysis
         </h2>

         <div class="grid grid-cols-3 gap-3">
           <div
             v-for="(avg, state) in report.jurisdictionalAnalysis.stateAverages
               .US"
             :key="state"
             class="bg-gray-900/50 p-3 rounded-lg"
           >
             <div class="text-sm text-accent">
               {{ getStateName("US", state) }}
             </div>
             <div class="text-white">${{ avg.toFixed(4) }}</div>
           </div>
         </div>
       </div>

       <!-- Canadian Provinces Section -->
       <div
         v-if="report.jurisdictionalAnalysis.stateAverages?.CA"
         class="bg-gray-800 p-6 rounded-lg"
       >
         <h2 class="text-xl text-white font-semibold mb-4">
           Canadian Provinces Analysis
         </h2>

         <div class="grid grid-cols-3 gap-3">
           <div
             v-for="(avg, province) in report.jurisdictionalAnalysis
               .stateAverages.CA"
             :key="province"
             class="bg-gray-900/50 p-3 rounded-lg"
           >
             <div class="text-sm text-accent">
               {{ getStateName("CA", province) }}
             </div>
             <div class="text-white">${{ avg.toFixed(4) }}</div>
           </div>
         </div>
       </div>

       <!-- Invalid NPAs Section -->
       <div v-if="hasInvalidNpas" class="bg-gray-800 p-6 rounded-lg">
         <h2 class="text-xl text-white font-semibold mb-4">Invalid NPAs</h2>

         <div
           v-if="report.jurisdictionalAnalysis.invalidNpas.file1.length"
           class="mb-4"
         >
           <div class="text-accent mb-2">{{ report.file1.fileName }}</div>
           <div class="bg-gray-900/50 p-3 rounded-lg">
             <div class="text-gray-400 text-sm mb-1">Invalid NPAs:</div>
             <div class="flex flex-wrap gap-2">
               <span
                 v-for="npa in report.jurisdictionalAnalysis.invalidNpas.file1"
                 :key="npa"
                 class="inline-block px-2 py-1 bg-red-900/30 border border-red-700/50 rounded text-xs text-red-400"
               >
                 {{ npa }}
               </span>
             </div>
           </div>
         </div>

         <div v-if="report.jurisdictionalAnalysis.invalidNpas.file2.length">
           <div class="text-accent mb-2">{{ report.file2.fileName }}</div>
           <div class="bg-gray-900/50 p-3 rounded-lg">
             <div class="text-gray-400 text-sm mb-1">Invalid NPAs:</div>
             <div class="flex flex-wrap gap-2">
               <span
                 v-for="npa in report.jurisdictionalAnalysis.invalidNpas.file2"
                 :key="npa"
                 class="inline-block px-2 py-1 bg-red-900/30 border border-red-700/50 rounded text-xs text-red-400"
               >
                 {{ npa }}
               </span>
             </div>
           </div>
         </div>
       </div>
     </div>
   </template>

   <script setup lang="ts">
   import { computed } from "vue";
   import type { USPricingReport } from "@/types/domains/us-types";
   import { useUsStore } from "@/stores/us-store";
   import { ReportTypes } from "@/types/app-types";
   import { COUNTRY_CODES } from "@/types/constants/country-codes";
   import { STATE_CODES } from "@/types/constants/state-codes";

   const props = defineProps<{
     report:
       | (USPricingReport & {
           jurisdictionalAnalysis?: {
             countryAverages: Record<string, number>;
             stateAverages: Record<string, Record<string, number>>;
             invalidNpas: {
               file1: string[];
               file2: string[];
             };
           };
         })
       | null;
   }>();

   const usStore = useUsStore();

   // Check if we have two files for comparison
   const hasTwoFiles = computed(() => {
     return usStore.reportsGenerated && props.report !== null;
   });

   // Check if there are invalid NPAs
   const hasInvalidNpas = computed(() => {
     if (!props.report?.jurisdictionalAnalysis?.invalidNpas) return false;

     return (
       props.report.jurisdictionalAnalysis.invalidNpas.file1.length > 0 ||
       props.report.jurisdictionalAnalysis.invalidNpas.file2.length > 0
     );
   });

   // Helper function to get country name
   function getCountryName(code: string): string {
     return COUNTRY_CODES[code] || code;
   }

   // Helper function to get state/province name
   function getStateName(country: string, code: string): string {
     return STATE_CODES[country]?.[code] || code;
   }

   // Function to navigate to the files tab
   function goToFilesTab() {
     usStore.setActiveReportType(ReportTypes.FILES);
   }
   </script>
   ```

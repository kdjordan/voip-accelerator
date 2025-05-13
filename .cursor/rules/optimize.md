# US Rate Sheet Service Performance Enhancements

This document outlines potential areas for improving the performance of the US Rate Sheet service, specifically focusing on file uploading, parsing, and Dexie storage.

## List of Enhancements Implemented:

1.  **Optimize LERG Lookup (`processRow`): [COMPLETED]**

    - **Problem:** The original `this.lergStore.getLocationByNPA(npa)` potentially iterated over arrays for each row inside the `step` callback of `Papa.parse`, causing a significant bottleneck, especially with large datasets.
    - **Solution:** Added a `npaToLocationMap: Map<string, { country: string; region: string }>` state property to `client/src/stores/lerg-store.ts`. This map acts as a reverse lookup cache. An internal action `_populateNpaToLocationMap` was created to build this map, and it's called whenever the primary LERG data sources (`usStates`, `canadaProvinces`, `otherCountries`) are updated via their respective `set*` actions. A new getter `getOptimizedLocationByNPA` was added, which performs an efficient O(1) (constant time) lookup directly on this `npaToLocationMap`. Finally, the `processRow` method in `client/src/services/us-rate-sheet.service.ts` was modified to use this new `getOptimizedLocationByNPA` getter instead of the original one.
    - **Result:** This change dramatically reduced the time spent retrieving the state code for each row during the file parsing process, leading to a faster overall upload time.

2.  **Dexie Table Indexing: [COMPLETED]**

    - **Problem:** IndexedDB write performance (like Dexie's `bulkPut`) and query performance are heavily influenced by table indices. Missing indices for frequently queried columns slow down reads, while too many or unnecessary indices can slow down writes.
    - **Solution:** Reviewed the Dexie schema definition for the `us_rate_sheet_db` database's `entries` table, located in `client/src/types/app-types.ts`. Based on anticipated usage (filtering/searching in `USRateSheetTable.vue`), indices were added for `npanxx` and `stateCode`. The primary key `++id` ensures efficient unique record identification and insertion order. The updated schema definition is: `'entries: ++id, npanxx, stateCode, npa, nxx, interRate, intraRate, indetermRate'`. The database version was manually incremented in `useDexieDB.ts` to apply this schema change.
    - **Result:** Adding these indices improves write performance during the `bulkPut` operations in `processFile` and significantly speeds up subsequent reads/queries that filter or sort by `npanxx` or `stateCode`.

_(Other potential enhancements like Database Clearing Strategy, Web Worker Utilization, Batch Size Tuning, and Minimizing Step Callback Work were considered but not implemented at this time, as the primary bottlenecks were addressed by the LERG lookup and indexing optimizations.)_

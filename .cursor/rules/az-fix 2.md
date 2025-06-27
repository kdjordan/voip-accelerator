# AZ Rate Sheet Memory & Performance Fixes Checklist

This checklist outlines areas to investigate and optimize regarding the excessive memory usage observed when uploading rate sheet CSV files.

## 🔍 Investigation Areas

### 1. Data Parsing & Initial Loading (`AZRateSheetView.vue`)

- [ ] **PapaParse Usage**: Review `Papa.parse` configuration. Ensure `header: false` and `skipEmptyLines: true` are correctly used. Check if `dynamicTyping` is enabled and if it's causing overhead (though typically not a major memory hog).
- [ ] **Preview Data**: The `previewData` only takes the first 10 rows. Confirm that `results.data` (full parsed data) isn't being held in memory unnecessarily in the component after the preview is extracted.
- [ ] **`selectedFile`**: Ensure `selectedFile.value = null` is reliably called in `handleModalConfirm` and `handleModalCancel` to release the file object from memory.
- [ ] **Error Handling**: Verify error paths also release resources gracefully.

### 2. Data Storage (`useAzRateSheetStore.ts`)

- [ ] **Store State**: Analyze the `az-rate-sheet-store.ts` for how it stores the parsed data. Is the _entire_ CSV data being held in memory in multiple formats? (e.g., `originalData`, `groupedData`, `invalidRows`).
- [ ] **Data Structure**: `groupedData` and `originalData` likely hold the same base data. Can `groupedData` be a computed property that derives from `originalData` _on-demand_ or is it intentionally denormalized?
- [ ] **Invalid Rows**: `store.invalidRows` also holds data. Is this data duplicated from other store properties? Can it be optimized?
- [ ] **Reactivity Overhead**: For large datasets, deeply reactive objects can incur significant memory and performance costs. Consider using `markRaw` for large, static datasets if they don't need to be deeply reactive.

### 3. Table Rendering & Reactivity (`AZRateSheetTable.vue`)

- [ ] **`filteredData` Computed Property**: This is a critical point. Every change to filters or search queries will re-evaluate this. For large datasets, this can be expensive. Ensure that the filtering logic is as efficient as possible.
- [ ] **`paginatedData` Computed Property**: This is good for limiting rendered rows, but the underlying `filteredData` still needs to be efficient.
- [ ] **Expanded Rows (`expandedRows`, `expandedRateCodes`)**: When rows are expanded, more data is displayed. For destinations with many codes, `getCodesForRate` could be inefficient if not properly cached or if it triggers re-reads of the main data array.
- [ ] **`codesCache`**: The implementation of `codesCache` is good. Verify its effectiveness and ensure it correctly prevents re-computation of codes for expanded rates.
- [ ] **`matchingCodes`**: Similar to `codesCache`, ensure this is used efficiently and cleared when the search query is empty.
- [ ] **Watcher Overhead**: Review all `watch` statements in `AZRateSheetTable.vue`. Are any of them inadvertently causing large re-renders or re-calculations of heavy computed properties?
- [ ] **Virtual Scrolling**: For very large tables (even with pagination, if users frequently jump between pages or expand many rows), consider implementing a virtualized list or table component to render only the visible rows in the DOM. This is a more advanced optimization but highly effective for memory and rendering performance.

### 4. Web Workers (`TableSorterWorker.ts`)

- [ ] **Worker Communication**: Ensure that data passed to/from the `TableSorterWorker` is done efficiently (e.g., using transferable objects where possible, though `postMessage` handles this for primitive types and plain objects).
- [ ] **Worker Data Duplication**: When data is sent to a worker, it's often serialized and deserialized, effectively creating a copy. Ensure that the main thread isn't holding onto the same large dataset that the worker is processing unnecessarily.
- [ ] **Offloading Heavy Operations**: Confirm that only truly heavy, blocking operations are moved to workers (sorting is a good candidate).

## 🚀 Potential Solutions & Optimizations

- [ ] **Deep Dive into `useAzRateSheetStore`**: This is likely the prime candidate for memory reduction. If `originalData` and `groupedData` essentially store the same large dataset, consider making `groupedData` entirely derived or optimizing its structure to avoid duplication.
- [ ] **Memoization/Caching**: Beyond `codesCache`, explore other areas where computed values could be memoized if their dependencies don't change often but their computation is expensive.
- [ ] **Refine Data Structure**: For each piece of data, question if _all_ its properties are needed at all times. Could some be loaded on-demand or trimmed?
- [ ] **Profiling**: Use Chrome DevTools (Memory tab -> Heap snapshot) to take snapshots before and after file upload/interaction to pinpoint exactly where memory is being consumed.
- [ ] **Debouncing & Throttling**: Ensure all search and filter inputs are effectively debounced to prevent excessive re-computations.

I recommend starting with profiling using browser developer tools, as that will give us concrete data on where the memory is being allocated. Once we have a better understanding of the memory hotspots, we can prioritize the optimizations.

## 🔴 Critical Memory Issue Analysis & Fix Plan

Based on the Chrome memory snapshot showing **292MB usage for a 1.6MB CSV file** (182x amplification!), here's the root cause analysis and fix plan:

### Root Causes Identified:

1. **Vue 3 Reactivity Overhead**: Every object in `originalData` and `groupedData` is wrapped in Vue's reactive proxy system, which adds significant memory overhead per object.

2. **Data Duplication**: The store maintains multiple copies of the same data:

   - `originalData`: Full parsed CSV records
   - `groupedData`: Processed/grouped version of the same data
   - `getGroupedData` getter: Recomputes the grouped data (though not stored, still processed)
   - Multiple Maps and intermediate arrays during processing

3. **String Duplication**: Destination names and prefixes are stored multiple times across different data structures without interning.

4. **Excessive Object Creation**: The `processRecordsIntoGroups` method creates many intermediate objects, Maps, and arrays.

### Immediate Fix Plan:

#### Phase 1: Remove Vue Reactivity from Large Datasets (Quick Win)

```typescript
import { markRaw, shallowRef } from 'vue';

// In the store state
state: (): RateSheetState => ({
  // Use shallowRef to prevent deep reactivity
  groupedData: shallowRef([]),
  originalData: shallowRef([]),
  // ... other state
})

// When setting data
setOriginalData(data: RateSheetRecord[]) {
  // Mark the array as raw to prevent Vue from making it reactive
  this.originalData = markRaw(data);
}

setGroupedData(data: GroupedRateData[]) {
  // Mark as raw to prevent reactivity overhead
  this.groupedData = markRaw(data);
}
```

#### Phase 2: Eliminate Data Duplication

- Remove the `getGroupedData` getter (it duplicates `groupedData`)
- Consider storing only `originalData` and computing `groupedData` on-demand
- OR store only `groupedData` if that's what's primarily used

#### Phase 3: Implement String Interning

```typescript
class StringIntern {
  private cache = new Map<string, string>();

  intern(str: string): string {
    if (!this.cache.has(str)) {
      this.cache.set(str, str);
    }
    return this.cache.get(str)!;
  }
}

// Use during parsing
const intern = new StringIntern();
validRecords.push({
  name: intern.intern(name),
  prefix: intern.intern(prefix),
  // ... rest
});
```

#### Phase 4: Optimize Data Structures

- Use typed arrays for numeric data (rates, counts)
- Store prefixes as a single concatenated string with indices
- Use more memory-efficient data structures

### Expected Results:

- **Immediate reduction of 50-70%** by removing Vue reactivity
- **Additional 20-30% reduction** by eliminating duplication
- **Final target: ~30-50MB** for a 1.6MB CSV (down from 292MB)

### Implementation Priority:

1. **TODAY**: Implement Phase 1 (markRaw/shallowRef) - easiest, biggest impact
2. **This Week**: Phase 2 (eliminate duplication)
3. **Next Sprint**: Phases 3 & 4 (optimization)

### Monitoring:

- Add memory usage logging before/after data load
- Use Chrome DevTools heap snapshots to verify improvements
- Consider adding a memory usage indicator in the UI

## 📋 Comprehensive Implementation Plan with Dependency Analysis

### Component Dependencies Analysis

After analyzing all dependent components and services, here's the complete dependency map:

#### 1. **Direct Store Data Access**

- **AZRateSheetView.vue**: Reads `hasStoredData`, `hasInvalidRows`, `invalidRows`, `getTotalRecords`, `getDiscrepancyCount`
- **AZRateSheetTable.vue**: Heavy usage of `groupedData`, `originalData`, `getGroupedData`, `getFilteredByRateBucket`
- **AZEffectiveDates.vue**: Reads/writes `groupedData`, `originalData`, `getDiscrepancyCount`
- **AZGlobalAdjustment.vue**: Reads `groupedData`, `canUseBucketAdjustments`, updates via `bulkUpdateDestinationRates`
- **AZBucketBulkAdjustment.vue**: Similar to global adjustment
- **az-rate-sheet.service.ts**: Direct access to `originalData`, calls store methods

#### 2. **Store Methods Used**

- `setOriginalData()`, `setGroupedData()`, `processRateSheetData()`
- `updateDestinationRate()`, `bulkUpdateDestinationRates()`
- `updateEffectiveDatesWithRecords()`, `updateGroupedDataEffectiveDates()`
- `processFileData()`, `processRecordsIntoGroups()`
- `clearData()`, `addInvalidRow()`, `clearInvalidRows()`
- `setEffectiveDateSettings()`, `setOptionalFields()`
- `isDestinationExcluded()`, `setOperationInProgress()`

#### 3. **Worker Dependencies**

- **az-effective-date-updater.worker.ts**: Expects `rawGroupedData` array, returns updated records
- **table-sorter.worker.ts**: Receives serialized `groupedData` for sorting
- **az-global-rate-adjuster.worker.ts**: Processes `groupedData` for bulk adjustments

### Phased Implementation Plan

#### **Phase 1: Non-Breaking Reactivity Optimization** (Day 1)

Implement without changing any component interfaces:

```typescript
// az-rate-sheet-store.ts
import { markRaw, shallowRef, triggerRef } from 'vue';

state: (): RateSheetState => ({
  // Keep the same interface but use shallowRef internally
  groupedData: [],
  originalData: [],
  // ... rest unchanged
}),

actions: {
  setOriginalData(data: RateSheetRecord[]) {
    // Use markRaw to prevent deep reactivity
    const rawData = markRaw(data);
    this.originalData = rawData as RateSheetRecord[];
    this.saveToLocalStorage();
  },

  setGroupedData(data: GroupedRateData[]) {
    // Use markRaw for grouped data too
    const rawData = markRaw(data);
    this.groupedData = rawData as GroupedRateData[];
  },

  // Add a method to trigger updates when needed
  triggerDataUpdate() {
    // Force reactivity update for components that need it
    this.groupedData = [...this.groupedData];
  }
}
```

**Testing Points:**

- All components should continue working
- Memory usage should drop by 50-70%
- May need to call `triggerDataUpdate()` after bulk operations

#### **Phase 2: Optimize Data Structure** (Day 2-3)

Remove the duplicate `getGroupedData` getter:

```typescript
getters: {
  // Remove getGroupedData getter - it duplicates state.groupedData
  // Update components to use state.groupedData directly

  // Keep all other getters unchanged
  getDiscrepancyCount: (state): number => {
    return state.groupedData.filter((group) => group.hasDiscrepancy).length;
  },
  // ... rest unchanged
}
```

**Component Updates Required:**

- Replace `store.getGroupedData` with `store.groupedData` in all components
- This is a simple find/replace operation

#### **Phase 3: Implement Smart Caching** (Day 4-5)

Add intelligent caching for expensive operations:

```typescript
// Add to store state
private _cachedFilteredData: Map<string, GroupedRateData[]> = new Map();
private _cacheVersion = 0;

actions: {
  // Invalidate cache when data changes
  invalidateCache() {
    this._cacheVersion++;
    this._cachedFilteredData.clear();
  },

  // Update bulk operations to invalidate cache
  bulkUpdateDestinationRates(updates: { name: string; rate: number }[]): boolean {
    const result = this._bulkUpdateRates(updates);
    if (result) {
      this.invalidateCache();
      this.triggerDataUpdate();
    }
    return result;
  }
}
```

#### **Phase 4: Worker Optimization** (Day 6)

Optimize worker communication to avoid data duplication:

```typescript
// For table sorting, send only essential data
const sortData = {
  data: groupedData.value.map((group) => ({
    destinationName: group.destinationName,
    codesLength: group.codes.length, // Send count instead of full array
    rate: group.rates[0]?.rate,
    hasDiscrepancy: group.hasDiscrepancy,
    changeCode: group.changeCode,
    effectiveDate: group.effectiveDate,
    // Only send what's needed for sorting
  })),
};
```

#### **Phase 5: String Interning** (Week 2)

Implement string interning during data import:

```typescript
class StringInternPool {
  private pool = new Map<string, string>();

  intern(str: string): string {
    const existing = this.pool.get(str);
    if (existing) return existing;
    this.pool.set(str, str);
    return str;
  }

  clear() {
    this.pool.clear();
  }
}

// Use in processFileData
const internPool = new StringInternPool();
validRecords.push({
  name: internPool.intern(name),
  prefix: internPool.intern(prefix),
  // ... rest
});
```

### Migration Checklist

#### **Before Starting:**

- [ ] Take memory snapshots of current implementation
- [ ] Document current memory usage patterns
- [ ] Create rollback plan

#### **Phase 1 Checklist:**

- [ ] Implement `markRaw` for data arrays
- [ ] Add `triggerDataUpdate` method
- [ ] Test all components still function
- [ ] Verify memory reduction

#### **Phase 2 Checklist:**

- [ ] Remove `getGroupedData` getter
- [ ] Update all component references
- [ ] Test filtering and sorting
- [ ] Verify no functionality lost

#### **Phase 3 Checklist:**

- [ ] Implement caching layer
- [ ] Add cache invalidation
- [ ] Test performance improvements
- [ ] Monitor cache hit rates

#### **Phase 4 Checklist:**

- [ ] Optimize worker payloads
- [ ] Test worker functionality
- [ ] Verify sorting still works
- [ ] Check for performance gains

#### **Phase 5 Checklist:**

- [ ] Implement string interning
- [ ] Test with large datasets
- [ ] Verify final memory usage
- [ ] Document total improvements

### Risk Mitigation

1. **Reactivity Issues**: Some components may rely on deep reactivity

   - Solution: Use `triggerDataUpdate()` after mutations
   - Fallback: Selectively make some data reactive

2. **Worker Compatibility**: Workers expect specific data formats

   - Solution: Transform data before sending to workers
   - Maintain backward compatibility during transition

3. **Component Breaking**: Direct data access might break
   - Solution: Implement gradually with feature flags
   - Test each component thoroughly

### Success Metrics

- **Memory Usage**: Target 80% reduction (292MB → ~60MB)
- **Performance**: No degradation in user experience
- **Functionality**: All features continue working
- **Load Time**: Faster initial data processing

### Timeline

- **Week 1**: Phases 1-3 (Core optimizations)
- **Week 2**: Phases 4-5 (Additional optimizations)
- **Week 3**: Testing, monitoring, and documentation

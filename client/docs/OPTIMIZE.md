# US Rate Sheet Upload Performance Optimization Plan

**Current Performance**: 20 seconds for 5.1MB file upload  
**Target Performance**: <1 second for 5.1MB file upload  
**Estimated Total Improvement**: 95%+

## 🔍 Root Cause Analysis

**Primary Bottleneck**: O(n) linear search in NPA lookups
- `getNPAInfo` performs array.find() on 450+ records for every row processed
- 50,000 rows × 450 NPAs = 22.5 million array comparisons
- Used in 5 critical files with high-frequency calls

**Secondary Bottlenecks**:
- Single-threaded CSV processing blocking main thread
- Sub-optimal IndexedDB batch operations
- No caching for repeated NPA lookups

## 📋 Three-Phase Optimization Strategy

### **Phase 1: NPA Lookup Index (Expected: 80% improvement)**
**Target**: 20s → 4s  
**Complexity**: Low  
**Risk**: Minimal  

**Implementation Strategy**: Maintain existing API while adding indexed lookup underneath.

#### **Changes Required**:

1. **Update `lerg-store-v2.ts`** - Add indexed lookup while preserving API:
```typescript
// Add private index property
private _npaIndex: Map<string, EnhancedNPARecord> | null = null;

// Update getNPAInfo to use index
getNPAInfo: (state) => (npa: string) => {
  // Lazy initialize index
  if (!state._npaIndex) {
    state._npaIndex = new Map(state.allNPAs.map(record => [record.npa, record]));
  }
  return state._npaIndex.get(npa) || null;
},

// Clear index when data changes
actions: {
  loadFromSupabase() {
    // ... existing code
    this._npaIndex = null; // Clear cache after data update
  },
  clearData() {
    // ... existing code  
    this._npaIndex = null; // Clear cache
  }
}
```

2. **Add missing `getOptimizedLocationByNPA` method** (referenced in us.service.ts):
```typescript
getOptimizedLocationByNPA: (state) => (npa: string) => {
  const record = state.getNPAInfo(npa);
  if (!record) return null;
  return {
    country: record.country_code,
    region: record.state_province_code,
    state: record.state_province_name,
    category: record.category
  };
}
```

3. **Add performance timing** to `us-rate-sheet.service.ts`:
```typescript
// At start of processFile method
const performanceStart = performance.now();
console.log(`[PERF] Phase 1 - Starting upload processing...`);

// At end of processFile method
const performanceEnd = performance.now();
const duration = (performanceEnd - performanceStart) / 1000;
console.log(`[PERF] Phase 1 - Upload completed in ${duration.toFixed(2)}s`);
```

#### **Files to Update**:
- `/src/stores/lerg-store-v2.ts` ✓
- `/src/services/us-rate-sheet.service.ts` ✓ (add timing)

#### **Testing**:
- Upload same 5.1MB file
- Compare console timing logs
- Verify all existing functionality works unchanged

---

### **Phase 2: Worker-Based Row Processing (Expected: 60% improvement)**
**Target**: 4s → 1.6s  
**Complexity**: Medium  
**Risk**: Medium  

**Implementation Strategy**: Move CPU-intensive row processing to Web Worker.

#### **Changes Required**:

1. **Create `src/workers/us-rate-processor.worker.ts`**:
```typescript
interface ProcessRowMessage {
  type: 'PROCESS_BATCH';
  rows: string[][];
  columnMapping: USRateSheetColumnMapping;
  npaLookupData: [string, any][]; // Serialized Map data
  startRowIndex: number;
  indeterminateDefinition?: string;
}

self.onmessage = function(e: MessageEvent<ProcessRowMessage>) {
  const { rows, columnMapping, npaLookupData, startRowIndex, indeterminateDefinition } = e.data;
  
  // Recreate NPA index from serialized data
  const npaIndex = new Map(npaLookupData);
  
  const results = rows.map((row, index) => 
    processRowInWorker(row, startRowIndex + index, columnMapping, npaIndex, indeterminateDefinition)
  );
  
  self.postMessage({
    type: 'BATCH_COMPLETE',
    validRows: results.filter(r => r.valid).map(r => r.data),
    invalidRows: results.filter(r => !r.valid).map(r => r.error)
  });
};
```

2. **Update `us-rate-sheet.service.ts`** to use worker batching:
```typescript
// Replace single-row processing with batch processing
const WORKER_BATCH_SIZE = 100;
let workerBatch: string[][] = [];

step: (results, parser) => {
  workerBatch.push(results.data as string[]);
  
  if (workerBatch.length >= WORKER_BATCH_SIZE) {
    this.processWorkerBatch(workerBatch, totalChunks - workerBatch.length);
    workerBatch = [];
  }
}
```

3. **Add Phase 2 performance timing**:
```typescript
console.log(`[PERF] Phase 2 - Upload completed in ${duration.toFixed(2)}s`);
```

#### **Files to Update**:
- `/src/workers/us-rate-processor.worker.ts` ✓ (new)
- `/src/services/us-rate-sheet.service.ts` ✓ (modify)

---

### **Phase 3: Storage & Memory Optimization (Expected: 40% improvement)**
**Target**: 1.6s → <1s  
**Complexity**: Medium  
**Risk**: Low  

**Implementation Strategy**: Optimize IndexedDB operations and memory usage.

#### **Changes Required**:

1. **Update `useDexieDB.ts`** - Optimize transaction handling:
```typescript
async function storeInDexieDBOptimized<T>(
  data: T[], 
  dbName: DBNameType, 
  storeName: string,
  options?: { sourceFile?: string; replaceExisting?: boolean }
) {
  const db = await getDB(dbName);
  const table = db.table(storeName);
  
  // Single transaction for all operations
  await db.transaction('rw', table, async () => {
    if (options?.replaceExisting) {
      await table.clear();
    }
    
    // Process in optimized chunks
    const OPTIMAL_CHUNK_SIZE = 500;
    for (let i = 0; i < data.length; i += OPTIMAL_CHUNK_SIZE) {
      const chunk = data.slice(i, i + OPTIMAL_CHUNK_SIZE);
      await table.bulkPut(chunk);
      
      // Yield control periodically
      if (i % 2000 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  });
}
```

2. **Add streaming storage** to avoid memory pressure:
```typescript
// Process and store data in smaller memory chunks
// Reduce BATCH_SIZE from 1000 to 250 for lower memory usage
const MEMORY_OPTIMIZED_BATCH_SIZE = 250;
```

3. **Add Phase 3 performance timing**:
```typescript
console.log(`[PERF] Phase 3 - Upload completed in ${duration.toFixed(2)}s`);
```

#### **Files to Update**:
- `/src/composables/useDexieDB.ts` ✓
- `/src/services/us-rate-sheet.service.ts` ✓ (batch size)

---

## 🧪 Performance Testing Framework

### **Automated Timing**
Each phase will include console.log statements with consistent formatting:
```
[PERF] Phase X - Upload completed in Y.YYs
```

### **Test Protocol**
1. Use the same 5.1MB test file for all phases
2. Clear browser cache between tests
3. Run 3 tests per phase and average results
4. Test in Chrome DevTools with Performance tab open

### **Success Metrics**
| Phase | Target Time | Improvement | Cumulative |
|-------|-------------|-------------|------------|
| Baseline | 20.0s | - | - |
| Phase 1 | 4.0s | 80% | 80% |
| Phase 2 | 1.6s | 60% | 92% |
| Phase 3 | <1.0s | 40% | 95%+ |

---

## 🚀 Implementation Recommendation

**Senior Engineering Approach**: 

1. **Phase 1 is the Priority** - Massive impact with minimal risk
2. **Preserve Existing APIs** - No breaking changes to working code
3. **Lazy Index Initialization** - Index created only when needed
4. **Memory Efficient** - 450 records × 2 = minimal memory overhead
5. **Backward Compatible** - All existing code continues to work

**Why This Approach**:
- ✅ 80% improvement with 2-hour implementation
- ✅ Zero breaking changes to existing functionality  
- ✅ Easy to rollback if issues arise
- ✅ Builds foundation for Phases 2-3

**Alternative Considered**: Complete rewrite with Map-only storage was rejected due to:
- Higher risk of breaking existing code
- Longer implementation time
- Same performance outcome as hybrid approach

---

## 📝 Implementation Checklist

### **Phase 1: NPA Index Optimization**
- [ ] Add `_npaIndex` property to lerg-store-v2.ts
- [ ] Update `getNPAInfo` to use Map lookup
- [ ] Add `getOptimizedLocationByNPA` method
- [ ] Add index clearing in data mutation actions  
- [ ] Add performance timing to us-rate-sheet.service.ts
- [ ] Test with 5.1MB file and record timing
- [ ] Verify all existing functionality unchanged

### **Phase 2: Worker Processing**
- [ ] Create us-rate-processor.worker.ts
- [ ] Implement batch processing logic
- [ ] Update us-rate-sheet.service.ts for worker communication
- [ ] Add worker error handling and fallback
- [ ] Update performance timing
- [ ] Test with 5.1MB file and record timing

### **Phase 3: Storage Optimization**  
- [ ] Optimize useDexieDB.ts transaction handling
- [ ] Implement streaming storage pattern
- [ ] Reduce memory pressure with smaller batches
- [ ] Add final performance timing
- [ ] Test with 5.1MB file and record timing
- [ ] Performance validation across all phases

---

## 📊 Expected Business Impact

**Before**: 20-second uploads frustrate users, limit file sizes  
**After**: Sub-second uploads enable larger files, better UX

**Development Time**: ~8-12 hours across 3 phases  
**Risk Level**: Low (Phase 1), Medium (Phases 2-3)  
**Maintenance**: Minimal - optimizations are internal implementation details
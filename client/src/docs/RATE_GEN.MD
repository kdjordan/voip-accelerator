# Rate Generation Feature Implementation Plan

## Executive Summary

The Rate Generation feature will enable users to upload multiple provider rate decks (up to 5 providers), apply Least Cost Routing (LCR) algorithms, add markup percentages, and generate new rate decks for export. This document provides a comprehensive implementation plan following the existing codebase patterns and architectural decisions.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technical Specifications](#technical-specifications)
3. [Implementation Phases](#implementation-phases)
4. [Component Architecture](#component-architecture)
5. [Service Layer Design](#service-layer-design)
6. [Database Schema](#database-schema)
7. [Worker Implementation](#worker-implementation)
8. [File-by-File Implementation Plan](#file-by-file-implementation-plan)
9. [Testing Strategy](#testing-strategy)
10. [Performance Optimization](#performance-optimization)
11. [Error Handling & Validation](#error-handling--validation)
12. [Future Extensibility](#future-extensibility)

## Architecture Overview

### Integration with Existing System

The Rate Generation feature will integrate seamlessly with the existing architecture by:

1. **Following Service Layer Pattern**: Creating `RateGenService` similar to existing `az-rate-sheet.service.ts` and `us-rate-sheet.service.ts`
2. **Using Pinia Store Management**: Implementing `rate-gen-store.ts` following patterns from `az-rate-sheet-store.ts`
3. **Leveraging Existing Components**: Reusing file upload components, tables, and modals
4. **Utilizing Web Workers**: Creating `rate-gen-lcr.worker.ts` for heavy LCR calculations
5. **IndexedDB with Dexie**: Using the established `useDexieDB` composable for data persistence

### Key Design Decisions

1. **Combined Storage Strategy**: All provider data stored in a single IndexedDB object store with composite keys (prefix + providerId)
2. **Batch Processing**: Process data in chunks of 10,000 rows to maintain UI responsiveness
3. **Memory Optimization**: Use `markRaw()` for large datasets to prevent Vue reactivity overhead
4. **Progressive Enhancement**: Start with basic functionality, add advanced features iteratively

## Technical Specifications

### Data Structure

```typescript
// Rate record structure
interface RateGenRecord {
  id?: number;
  prefix: string;           // 7-digit prefix (e.g., "1201007")
  providerId: string;       // Provider identifier
  providerName: string;     // Display name
  rateInter: number;        // Interstate rate
  rateIntra: number;        // Intrastate rate
  rateIndeterminate: number; // Indeterminate rate
  uploadSessionId: string;   // Track upload batch
  createdAt: Date;
}

// Upload session metadata
interface RateGenUploadSession {
  id: string;
  providerId: string;
  providerName: string;
  fileName: string;
  rowCount: number;
  uploadDate: Date;
  status: 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

// Generated rate deck
interface GeneratedRateDeck {
  id: string;
  name: string;
  lcrStrategy: 'cheapest' | 'second' | 'third' | 'average';
  markupPercentage: number;
  providerIds: string[];
  generatedDate: Date;
  rowCount: number;
  exportFormat?: 'csv' | 'excel';
}
```

### LCR Strategy Options

1. **Cheapest**: Select the lowest rate across all providers
2. **Second Cheapest**: Select the second-lowest rate
3. **Third Cheapest**: Select the third-lowest rate
4. **Average Top 3**: Calculate average of three lowest rates

### Performance Requirements

- Handle 5 providers × 250,000 rows = 1.25M total records
- LCR calculation should complete within 30 seconds
- UI should remain responsive during processing
- Memory usage should not exceed 500MB

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create basic service and store structure
- [ ] Implement database schema with Dexie
- [ ] Set up file upload UI components
- [ ] Basic CSV parsing and validation

### Phase 2: Core Processing (Week 2)
- [ ] Implement LCR calculation worker
- [ ] Add batch processing for large datasets
- [ ] Create progress tracking system
- [ ] Implement data validation and error handling

### Phase 3: UI Enhancement (Week 3)
- [ ] Build provider management interface
- [ ] Add LCR strategy selection
- [ ] Implement markup configuration
- [ ] Create preview functionality

### Phase 4: Export & Polish (Week 4)
- [ ] Implement CSV export with formatting options
- [ ] Add comprehensive error handling
- [ ] Performance optimization
- [ ] Testing and bug fixes

## Component Architecture

### Component Hierarchy

```
RateGenView.vue (Main container)
├── RateGenHeader.vue (Title, actions)
├── RateGenProviderList.vue (Manage providers)
│   └── RateGenProviderCard.vue (Individual provider)
├── RateGenUploadModal.vue (File upload interface)
│   ├── RateGenFileDropzone.vue
│   └── RateGenColumnMapper.vue
├── RateGenConfiguration.vue (LCR & markup settings)
│   ├── RateGenLCRSelector.vue
│   └── RateGenMarkupInput.vue
├── RateGenPreview.vue (Preview generated rates)
│   └── RateGenPreviewTable.vue
└── RateGenExportModal.vue (Export options)
```

### Component Responsibilities

1. **RateGenView.vue**: Main orchestrator, manages overall state
2. **RateGenProviderList.vue**: Displays uploaded providers, allows management
3. **RateGenUploadModal.vue**: Handles file upload and column mapping
4. **RateGenConfiguration.vue**: LCR strategy and markup configuration
5. **RateGenPreview.vue**: Shows sample of generated rates
6. **RateGenExportModal.vue**: Export format and options

## Service Layer Design

### RateGenService Class

```typescript
export class RateGenService {
  private store: ReturnType<typeof useRateGenStore>;
  private db: ReturnType<typeof useDexieDB>;
  private worker: Worker;

  constructor() {
    this.store = useRateGenStore();
    this.db = useDexieDB();
    this.worker = new Worker('/src/workers/rate-gen-lcr.worker.ts');
  }

  // File processing
  async processProviderFile(file: File, providerId: string): Promise<void>;
  
  // LCR calculations
  async generateRateDeck(config: LCRConfig): Promise<GeneratedRateDeck>;
  
  // Data management
  async removeProvider(providerId: string): Promise<void>;
  async clearAllData(): Promise<void>;
  
  // Export functionality
  async exportRateDeck(deckId: string, format: ExportFormat): Promise<Blob>;
}
```

### Key Service Methods

1. **processProviderFile**: Parse CSV, validate data, store in IndexedDB
2. **generateRateDeck**: Apply LCR algorithm and markup
3. **removeProvider**: Clean up provider data
4. **exportRateDeck**: Generate CSV/Excel file for download

## Database Schema

### Dexie Configuration

```typescript
// In useDexieDB composable extension
const rateGenDb = new Dexie('RateGenDB');

rateGenDb.version(1).stores({
  rates: '++id, [prefix+providerId], providerId, uploadSessionId',
  uploadSessions: 'id, providerId, uploadDate',
  generatedDecks: 'id, generatedDate'
});
```

### Indexing Strategy

1. **Composite Index**: `[prefix+providerId]` for unique constraint
2. **Provider Index**: Quick filtering by provider
3. **Session Index**: Batch operations and cleanup

## Worker Implementation

### rate-gen-lcr.worker.ts

```typescript
interface LCRWorkerMessage {
  type: 'calculate' | 'cancel';
  data?: {
    strategy: LCRStrategy;
    markupPercentage: number;
    batchStart: number;
    batchSize: number;
  };
}

self.addEventListener('message', async (event: MessageEvent<LCRWorkerMessage>) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'calculate':
      const results = await calculateLCR(data);
      self.postMessage({ type: 'result', data: results });
      break;
    case 'cancel':
      // Handle cancellation
      break;
  }
});

async function calculateLCR(config: LCRConfig): Promise<RateGenRecord[]> {
  // Implementation of LCR algorithm
  // Process in batches, report progress
}
```

## File-by-File Implementation Plan

### 1. Store Implementation
**File**: `/client/src/stores/rate-gen-store.ts`
```typescript
export const useRateGenStore = defineStore('rateGen', () => {
  // State
  const providers = ref<Map<string, ProviderInfo>>(new Map());
  const uploadProgress = ref<Map<string, number>>(new Map());
  const generationProgress = ref(0);
  const currentConfig = ref<LCRConfig | null>(null);
  const isProcessing = ref(false);
  const errors = ref<string[]>([]);
  
  // Actions
  function addProvider(provider: ProviderInfo) { /* ... */ }
  function removeProvider(providerId: string) { /* ... */ }
  function setUploadProgress(providerId: string, progress: number) { /* ... */ }
  function setGenerationProgress(progress: number) { /* ... */ }
  function setConfig(config: LCRConfig) { /* ... */ }
  function addError(error: string) { /* ... */ }
  function clearErrors() { /* ... */ }
  
  // Getters
  const providerList = computed(() => Array.from(providers.value.values()));
  const canGenerate = computed(() => providers.value.size >= 2);
  
  return {
    // State
    providers,
    uploadProgress,
    generationProgress,
    currentConfig,
    isProcessing,
    errors,
    
    // Actions
    addProvider,
    removeProvider,
    setUploadProgress,
    setGenerationProgress,
    setConfig,
    addError,
    clearErrors,
    
    // Getters
    providerList,
    canGenerate
  };
});
```

### 2. Service Implementation
**File**: `/client/src/services/rate-gen.service.ts`
```typescript
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { useRateGenStore } from '@/stores/rate-gen-store';
import { useDexieDB } from '@/composables/useDexieDB';

export class RateGenService {
  private store: ReturnType<typeof useRateGenStore>;
  private db: any; // Dexie instance
  private worker: Worker | null = null;

  constructor() {
    this.store = useRateGenStore();
    this.initializeDB();
  }

  private async initializeDB() {
    const { getDexieDB } = useDexieDB();
    this.db = await getDexieDB('rateGen', {
      rates: '++id, [prefix+providerId], providerId, uploadSessionId',
      uploadSessions: 'id, providerId, uploadDate',
      generatedDecks: 'id, generatedDate'
    });
  }

  async processProviderFile(file: File, providerId: string, providerName: string): Promise<void> {
    const sessionId = uuidv4();
    this.store.setUploadProgress(providerId, 0);

    try {
      // Create upload session
      await this.db.uploadSessions.add({
        id: sessionId,
        providerId,
        providerName,
        fileName: file.name,
        uploadDate: new Date(),
        status: 'processing'
      });

      // Parse CSV
      await this.parseAndStoreCSV(file, providerId, providerName, sessionId);
      
      // Update session status
      await this.db.uploadSessions.update(sessionId, { status: 'completed' });
      
      // Add to store
      this.store.addProvider({
        id: providerId,
        name: providerName,
        fileName: file.name,
        rowCount: await this.db.rates.where({ providerId }).count(),
        uploadDate: new Date()
      });

    } catch (error) {
      await this.db.uploadSessions.update(sessionId, { 
        status: 'error',
        errorMessage: error.message 
      });
      throw error;
    }
  }

  private async parseAndStoreCSV(
    file: File, 
    providerId: string, 
    providerName: string,
    sessionId: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const batchSize = 10000;
      let batch: RateGenRecord[] = [];
      let rowCount = 0;

      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        step: async (row) => {
          // Validate and transform row
          const record = this.transformRow(row.data, providerId, providerName, sessionId);
          if (record) {
            batch.push(record);
            rowCount++;
          }

          // Store batch
          if (batch.length >= batchSize) {
            await this.storeBatch(batch);
            batch = [];
            this.store.setUploadProgress(providerId, (rowCount / 250000) * 100);
          }
        },
        complete: async () => {
          // Store remaining records
          if (batch.length > 0) {
            await this.storeBatch(batch);
          }
          this.store.setUploadProgress(providerId, 100);
          resolve();
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  private transformRow(
    data: any, 
    providerId: string, 
    providerName: string,
    sessionId: string
  ): RateGenRecord | null {
    // Validate required fields
    if (!data.prefix || !data.rate) {
      return null;
    }

    return {
      prefix: String(data.prefix).padStart(7, '0'),
      providerId,
      providerName,
      rateInter: parseFloat(data.rate) || 0,
      rateIntra: parseFloat(data.intrastate) || parseFloat(data.rate) || 0,
      rateIndeterminate: parseFloat(data.indeterminate) || parseFloat(data.rate) || 0,
      uploadSessionId: sessionId,
      createdAt: new Date()
    };
  }

  private async storeBatch(batch: RateGenRecord[]): Promise<void> {
    try {
      await this.db.rates.bulkPut(batch);
    } catch (error) {
      console.error('Batch storage error:', error);
      throw new Error('Failed to store rate data');
    }
  }

  async generateRateDeck(config: LCRConfig): Promise<GeneratedRateDeck> {
    this.store.setGenerationProgress(0);
    this.store.isProcessing = true;

    try {
      // Initialize worker
      this.worker = new Worker(
        new URL('@/workers/rate-gen-lcr.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Get unique prefixes
      const prefixes = await this.getUniquePrefixes();
      const totalPrefixes = prefixes.length;
      const generatedRates: GeneratedRateRecord[] = [];

      // Process in batches
      const batchSize = 5000;
      for (let i = 0; i < totalPrefixes; i += batchSize) {
        const batchPrefixes = prefixes.slice(i, i + batchSize);
        const batchRates = await this.processPrefixBatch(batchPrefixes, config);
        generatedRates.push(...batchRates);
        
        this.store.setGenerationProgress((i + batchSize) / totalPrefixes * 100);
      }

      // Store generated deck metadata
      const deck: GeneratedRateDeck = {
        id: uuidv4(),
        name: config.name || `Generated Deck ${new Date().toLocaleString()}`,
        lcrStrategy: config.strategy,
        markupPercentage: config.markupPercentage,
        providerIds: Array.from(this.store.providers.keys()),
        generatedDate: new Date(),
        rowCount: generatedRates.length
      };

      await this.db.generatedDecks.add(deck);
      
      // Store generated rates temporarily for export
      this.temporaryGeneratedRates = generatedRates;
      
      return deck;

    } finally {
      this.store.isProcessing = false;
      this.worker?.terminate();
      this.worker = null;
    }
  }

  private async getUniquePrefixes(): Promise<string[]> {
    const allRates = await this.db.rates.toArray();
    const prefixSet = new Set(allRates.map(r => r.prefix));
    return Array.from(prefixSet);
  }

  private async processPrefixBatch(
    prefixes: string[], 
    config: LCRConfig
  ): Promise<GeneratedRateRecord[]> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      this.worker.onmessage = (event) => {
        if (event.data.type === 'result') {
          resolve(event.data.data);
        } else if (event.data.type === 'error') {
          reject(new Error(event.data.error));
        }
      };

      // Get rates for these prefixes
      Promise.all(
        prefixes.map(async (prefix) => {
          const rates = await this.db.rates.where({ prefix }).toArray();
          return { prefix, rates };
        })
      ).then(prefixRates => {
        this.worker!.postMessage({
          type: 'calculate',
          data: {
            prefixRates,
            strategy: config.strategy,
            markupPercentage: config.markupPercentage
          }
        });
      });
    });
  }

  async removeProvider(providerId: string): Promise<void> {
    try {
      // Delete all rates for this provider
      await this.db.rates.where({ providerId }).delete();
      
      // Delete upload sessions
      await this.db.uploadSessions.where({ providerId }).delete();
      
      // Update store
      this.store.removeProvider(providerId);
      
    } catch (error) {
      console.error('Error removing provider:', error);
      throw new Error('Failed to remove provider data');
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await this.db.rates.clear();
      await this.db.uploadSessions.clear();
      await this.db.generatedDecks.clear();
      
      // Clear store
      this.store.providers.clear();
      this.store.uploadProgress.clear();
      this.store.generationProgress = 0;
      this.store.currentConfig = null;
      this.store.errors = [];
      
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('Failed to clear all data');
    }
  }

  async exportRateDeck(deckId: string, format: 'csv' | 'excel'): Promise<Blob> {
    // Get deck metadata
    const deck = await this.db.generatedDecks.get(deckId);
    if (!deck) {
      throw new Error('Generated deck not found');
    }

    // For now, implement CSV export
    if (format === 'csv') {
      return this.exportAsCSV(this.temporaryGeneratedRates);
    } else {
      throw new Error('Excel export not yet implemented');
    }
  }

  private exportAsCSV(rates: GeneratedRateRecord[]): Blob {
    const csv = Papa.unparse(rates, {
      columns: ['prefix', 'rate', 'intrastate', 'indeterminate'],
      header: true
    });
    
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  // Temporary storage for generated rates (would be better in IndexedDB for production)
  private temporaryGeneratedRates: GeneratedRateRecord[] = [];
}
```

### 3. Main View Component
**File**: `/client/src/pages/RateGenView.vue`
```vue
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';
import { RateGenService } from '@/services/rate-gen.service';
import RateGenHeader from '@/components/rate-gen/RateGenHeader.vue';
import RateGenProviderList from '@/components/rate-gen/RateGenProviderList.vue';
import RateGenUploadModal from '@/components/rate-gen/RateGenUploadModal.vue';
import RateGenConfiguration from '@/components/rate-gen/RateGenConfiguration.vue';
import RateGenPreview from '@/components/rate-gen/RateGenPreview.vue';
import RateGenExportModal from '@/components/rate-gen/RateGenExportModal.vue';

const store = useRateGenStore();
const service = new RateGenService();

// Modal states
const showUploadModal = ref(false);
const showExportModal = ref(false);

// Generated deck data
const generatedDeck = ref<GeneratedRateDeck | null>(null);

// Computed
const canGenerate = computed(() => 
  store.providerList.length >= 2 && 
  store.currentConfig !== null &&
  !store.isProcessing
);

// Methods
const handleAddProvider = () => {
  showUploadModal.value = true;
};

const handleProviderUpload = async (file: File, providerId: string, providerName: string) => {
  try {
    await service.processProviderFile(file, providerId, providerName);
    showUploadModal.value = false;
  } catch (error) {
    store.addError(`Failed to upload ${file.name}: ${error.message}`);
  }
};

const handleRemoveProvider = async (providerId: string) => {
  if (confirm('Are you sure you want to remove this provider?')) {
    try {
      await service.removeProvider(providerId);
    } catch (error) {
      store.addError(`Failed to remove provider: ${error.message}`);
    }
  }
};

const handleGenerateRates = async () => {
  if (!store.currentConfig) return;
  
  try {
    generatedDeck.value = await service.generateRateDeck(store.currentConfig);
    // Auto-show export modal after generation
    showExportModal.value = true;
  } catch (error) {
    store.addError(`Failed to generate rates: ${error.message}`);
  }
};

const handleExport = async (format: 'csv' | 'excel') => {
  if (!generatedDeck.value) return;
  
  try {
    const blob = await service.exportRateDeck(generatedDeck.value.id, format);
    
    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rate-deck-${generatedDeck.value.id}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showExportModal.value = false;
  } catch (error) {
    store.addError(`Failed to export: ${error.message}`);
  }
};

const handleClearAll = async () => {
  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    try {
      await service.clearAllData();
      generatedDeck.value = null;
    } catch (error) {
      store.addError(`Failed to clear data: ${error.message}`);
    }
  }
};

// Lifecycle
onMounted(() => {
  // Initialize any needed data
});

onUnmounted(() => {
  // Cleanup
});
</script>

<template>
  <div class="rate-gen-container">
    <RateGenHeader 
      @add-provider="handleAddProvider"
      @clear-all="handleClearAll"
    />
    
    <div class="rate-gen-content">
      <!-- Provider List Section -->
      <section class="provider-section">
        <h2 class="section-title">Uploaded Providers</h2>
        <RateGenProviderList
          :providers="store.providerList"
          :upload-progress="store.uploadProgress"
          @remove-provider="handleRemoveProvider"
        />
      </section>
      
      <!-- Configuration Section -->
      <section class="config-section" v-if="store.providerList.length >= 2">
        <h2 class="section-title">Rate Generation Configuration</h2>
        <RateGenConfiguration
          :current-config="store.currentConfig"
          @update-config="store.setConfig"
        />
      </section>
      
      <!-- Preview Section -->
      <section class="preview-section" v-if="generatedDeck">
        <h2 class="section-title">Generated Rates Preview</h2>
        <RateGenPreview
          :deck-id="generatedDeck.id"
          :total-rows="generatedDeck.rowCount"
        />
      </section>
      
      <!-- Generate Button -->
      <div class="action-buttons" v-if="store.providerList.length >= 2">
        <button
          @click="handleGenerateRates"
          :disabled="!canGenerate"
          class="generate-button"
        >
          <span v-if="!store.isProcessing">Generate Rate Deck</span>
          <span v-else>Generating... {{ store.generationProgress.toFixed(0) }}%</span>
        </button>
      </div>
      
      <!-- Error Display -->
      <div v-if="store.errors.length > 0" class="error-container">
        <div v-for="(error, index) in store.errors" :key="index" class="error-message">
          {{ error }}
          <button @click="store.errors.splice(index, 1)" class="error-dismiss">×</button>
        </div>
      </div>
    </div>
    
    <!-- Modals -->
    <RateGenUploadModal
      v-if="showUploadModal"
      @close="showUploadModal = false"
      @upload="handleProviderUpload"
    />
    
    <RateGenExportModal
      v-if="showExportModal && generatedDeck"
      :deck="generatedDeck"
      @close="showExportModal = false"
      @export="handleExport"
    />
  </div>
</template>

<style scoped>
.rate-gen-container {
  @apply min-h-screen bg-gray-50;
}

.rate-gen-content {
  @apply max-w-7xl mx-auto px-4 py-8;
}

.section-title {
  @apply text-2xl font-semibold text-gray-800 mb-4;
}

.provider-section,
.config-section,
.preview-section {
  @apply mb-8 bg-white rounded-lg shadow-sm p-6;
}

.action-buttons {
  @apply flex justify-center mt-8;
}

.generate-button {
  @apply px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
         disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors
         text-lg font-medium;
}

.error-container {
  @apply mt-4 space-y-2;
}

.error-message {
  @apply bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg
         flex items-center justify-between;
}

.error-dismiss {
  @apply ml-4 text-red-700 hover:text-red-900 text-xl font-bold;
}
</style>
```

### 4. Worker Implementation
**File**: `/client/src/workers/rate-gen-lcr.worker.ts`
```typescript
interface LCRWorkerMessage {
  type: 'calculate' | 'cancel';
  data?: {
    prefixRates: Array<{
      prefix: string;
      rates: RateGenRecord[];
    }>;
    strategy: 'cheapest' | 'second' | 'third' | 'average';
    markupPercentage: number;
  };
}

interface GeneratedRateRecord {
  prefix: string;
  rate: number;
  intrastate: number;
  indeterminate: number;
  selectedProvider?: string;
  appliedMarkup: number;
}

// Handle messages from main thread
self.addEventListener('message', (event: MessageEvent<LCRWorkerMessage>) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'calculate':
      try {
        const results = calculateLCR(data!);
        self.postMessage({ type: 'result', data: results });
      } catch (error) {
        self.postMessage({ type: 'error', error: error.message });
      }
      break;
      
    case 'cancel':
      // Handle cancellation if needed
      break;
  }
});

function calculateLCR(config: {
  prefixRates: Array<{ prefix: string; rates: RateGenRecord[] }>;
  strategy: 'cheapest' | 'second' | 'third' | 'average';
  markupPercentage: number;
}): GeneratedRateRecord[] {
  const { prefixRates, strategy, markupPercentage } = config;
  const results: GeneratedRateRecord[] = [];
  
  for (const { prefix, rates } of prefixRates) {
    if (rates.length === 0) continue;
    
    // Calculate LCR for each rate type
    const interRate = calculateRateByStrategy(
      rates.map(r => ({ rate: r.rateInter, provider: r.providerName })),
      strategy
    );
    
    const intraRate = calculateRateByStrategy(
      rates.map(r => ({ rate: r.rateIntra, provider: r.providerName })),
      strategy
    );
    
    const indeterminateRate = calculateRateByStrategy(
      rates.map(r => ({ rate: r.rateIndeterminate, provider: r.providerName })),
      strategy
    );
    
    // Apply markup
    const markupMultiplier = 1 + (markupPercentage / 100);
    
    results.push({
      prefix,
      rate: applyMarkup(interRate.rate, markupMultiplier),
      intrastate: applyMarkup(intraRate.rate, markupMultiplier),
      indeterminate: applyMarkup(indeterminateRate.rate, markupMultiplier),
      selectedProvider: interRate.provider,
      appliedMarkup: markupPercentage
    });
  }
  
  return results;
}

function calculateRateByStrategy(
  rates: Array<{ rate: number; provider: string }>,
  strategy: 'cheapest' | 'second' | 'third' | 'average'
): { rate: number; provider: string } {
  // Sort rates by value
  const sorted = rates
    .filter(r => r.rate > 0) // Exclude zero rates
    .sort((a, b) => a.rate - b.rate);
  
  if (sorted.length === 0) {
    return { rate: 0, provider: 'None' };
  }
  
  switch (strategy) {
    case 'cheapest':
      return sorted[0];
      
    case 'second':
      return sorted[1] || sorted[0];
      
    case 'third':
      return sorted[2] || sorted[1] || sorted[0];
      
    case 'average':
      const top3 = sorted.slice(0, 3);
      const avgRate = top3.reduce((sum, r) => sum + r.rate, 0) / top3.length;
      return {
        rate: avgRate,
        provider: top3.map(r => r.provider).join(', ')
      };
      
    default:
      return sorted[0];
  }
}

function applyMarkup(rate: number, markupMultiplier: number): number {
  // Round to 6 decimal places (typical for telecom rates)
  return Math.round(rate * markupMultiplier * 1000000) / 1000000;
}

// Export for testing
export { calculateLCR, calculateRateByStrategy, applyMarkup };
```

### 5. Additional Components

#### RateGenProviderCard.vue
**File**: `/client/src/components/rate-gen/RateGenProviderCard.vue`
```vue
<script setup lang="ts">
import { computed } from 'vue';
import type { ProviderInfo } from '@/types/rate-gen-types';

interface Props {
  provider: ProviderInfo;
  uploadProgress?: number;
}

interface Emits {
  (e: 'remove'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isUploading = computed(() => 
  props.uploadProgress !== undefined && props.uploadProgress < 100
);

const formattedDate = computed(() => 
  new Date(props.provider.uploadDate).toLocaleDateString()
);

const formattedRowCount = computed(() => 
  props.provider.rowCount.toLocaleString()
);
</script>

<template>
  <div class="provider-card">
    <div class="provider-header">
      <h3 class="provider-name">{{ provider.name }}</h3>
      <button 
        @click="emit('remove')"
        class="remove-button"
        :disabled="isUploading"
        title="Remove provider"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <div class="provider-details">
      <div class="detail-item">
        <span class="detail-label">File:</span>
        <span class="detail-value">{{ provider.fileName }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Rows:</span>
        <span class="detail-value">{{ formattedRowCount }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Uploaded:</span>
        <span class="detail-value">{{ formattedDate }}</span>
      </div>
    </div>
    
    <!-- Upload Progress -->
    <div v-if="isUploading" class="upload-progress">
      <div class="progress-bar">
        <div 
          class="progress-fill"
          :style="{ width: `${uploadProgress}%` }"
        ></div>
      </div>
      <span class="progress-text">{{ uploadProgress?.toFixed(0) }}%</span>
    </div>
  </div>
</template>

<style scoped>
.provider-card {
  @apply bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow;
}

.provider-header {
  @apply flex items-center justify-between mb-3;
}

.provider-name {
  @apply text-lg font-medium text-gray-800;
}

.remove-button {
  @apply text-gray-400 hover:text-red-600 transition-colors p-1 rounded
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.provider-details {
  @apply space-y-1;
}

.detail-item {
  @apply flex items-center text-sm;
}

.detail-label {
  @apply text-gray-500 mr-2;
}

.detail-value {
  @apply text-gray-700;
}

.upload-progress {
  @apply mt-3;
}

.progress-bar {
  @apply w-full bg-gray-200 rounded-full h-2 overflow-hidden;
}

.progress-fill {
  @apply bg-primary-600 h-full transition-all duration-300;
}

.progress-text {
  @apply text-xs text-gray-600 mt-1 block text-center;
}
</style>
```

#### RateGenLCRSelector.vue
**File**: `/client/src/components/rate-gen/RateGenLCRSelector.vue`
```vue
<script setup lang="ts">
import { ref, watch } from 'vue';

type LCRStrategy = 'cheapest' | 'second' | 'third' | 'average';

interface Props {
  modelValue: LCRStrategy;
}

interface Emits {
  (e: 'update:modelValue', value: LCRStrategy): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const strategies = [
  { value: 'cheapest', label: 'Cheapest Rate', description: 'Select the lowest rate from all providers' },
  { value: 'second', label: 'Second Cheapest', description: 'Select the second-lowest rate' },
  { value: 'third', label: 'Third Cheapest', description: 'Select the third-lowest rate' },
  { value: 'average', label: 'Average Top 3', description: 'Calculate average of three lowest rates' }
] as const;

const selectedStrategy = ref<LCRStrategy>(props.modelValue);

watch(selectedStrategy, (newValue) => {
  emit('update:modelValue', newValue);
});
</script>

<template>
  <div class="lcr-selector">
    <h3 class="selector-title">Least Cost Routing Strategy</h3>
    <div class="strategy-options">
      <label 
        v-for="strategy in strategies" 
        :key="strategy.value"
        class="strategy-option"
      >
        <input
          type="radio"
          v-model="selectedStrategy"
          :value="strategy.value"
          class="strategy-radio"
        />
        <div class="strategy-content">
          <span class="strategy-label">{{ strategy.label }}</span>
          <span class="strategy-description">{{ strategy.description }}</span>
        </div>
      </label>
    </div>
  </div>
</template>

<style scoped>
.lcr-selector {
  @apply space-y-4;
}

.selector-title {
  @apply text-lg font-medium text-gray-800;
}

.strategy-options {
  @apply space-y-3;
}

.strategy-option {
  @apply flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer
         hover:border-primary-300 hover:bg-primary-50 transition-all;
}

.strategy-radio {
  @apply mt-1 mr-3 text-primary-600 focus:ring-primary-500;
}

.strategy-content {
  @apply flex flex-col;
}

.strategy-label {
  @apply font-medium text-gray-800;
}

.strategy-description {
  @apply text-sm text-gray-600 mt-1;
}

.strategy-option:has(input:checked) {
  @apply border-primary-500 bg-primary-50;
}
</style>
```

## Testing Strategy

### Unit Tests

1. **Service Tests** (`rate-gen.service.test.ts`)
   - Test CSV parsing and validation
   - Test batch processing logic
   - Test LCR calculations
   - Test export functionality

2. **Store Tests** (`rate-gen-store.test.ts`)
   - Test state management
   - Test computed properties
   - Test actions and mutations

3. **Worker Tests** (`rate-gen-lcr.worker.test.ts`)
   - Test LCR algorithms for each strategy
   - Test markup calculations
   - Test edge cases (empty data, single provider)

### Integration Tests

1. **End-to-End Workflow**
   - Upload multiple providers
   - Configure LCR settings
   - Generate rate deck
   - Export results

2. **Performance Tests**
   - Test with maximum data (5 providers × 250k rows)
   - Measure memory usage
   - Verify UI responsiveness

### Test Data

Create sample CSV files with varying characteristics:
- Small dataset (1,000 rows)
- Medium dataset (50,000 rows)
- Large dataset (250,000 rows)
- Edge cases (missing data, invalid formats)

## Performance Optimization

### Memory Management

1. **Streaming Processing**
   - Parse CSV files in chunks
   - Process data in batches
   - Clear temporary data after use

2. **IndexedDB Optimization**
   - Use compound indexes for fast lookups
   - Batch database operations
   - Implement data cleanup strategies

3. **Vue Reactivity**
   - Use `markRaw()` for large datasets
   - Minimize reactive data
   - Use computed properties efficiently

### UI Responsiveness

1. **Web Workers**
   - Offload heavy calculations
   - Report progress incrementally
   - Allow cancellation

2. **Progressive Loading**
   - Virtual scrolling for large tables
   - Lazy loading of preview data
   - Pagination where appropriate

3. **Debouncing**
   - Debounce search inputs
   - Throttle progress updates
   - Batch UI updates

## Error Handling & Validation

### File Validation

1. **Pre-Upload Checks**
   - File size limits (max 100MB)
   - File type validation (.csv only)
   - Column header validation

2. **Data Validation**
   - Prefix format (7 digits)
   - Rate values (numeric, positive)
   - Required fields presence

3. **Error Recovery**
   - Rollback failed uploads
   - Clear partial data
   - Informative error messages

### User Feedback

1. **Progress Indicators**
   - Upload progress per file
   - Generation progress
   - Time estimates

2. **Error Messages**
   - Clear, actionable messages
   - Suggest fixes
   - Allow retry

3. **Success Feedback**
   - Completion notifications
   - Summary statistics
   - Next steps guidance

## Future Extensibility

### Planned Enhancements

1. **Advanced Features**
   - Custom LCR rules
   - Rate floors/ceilings
   - Provider prioritization
   - Historical rate tracking

2. **Export Options**
   - Excel format support
   - Custom column mapping
   - Multiple format templates
   - API integration

3. **Performance Features**
   - Background processing
   - Scheduled generation
   - Incremental updates
   - Cloud storage integration

### Architecture Considerations

1. **Scalability**
   - Support for more providers
   - Larger datasets
   - Real-time updates

2. **Integration**
   - API endpoints
   - Webhook notifications
   - Third-party integrations

3. **Analytics**
   - Usage tracking
   - Performance metrics
   - Cost analysis

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create RateGenService class structure
- [ ] Implement rate-gen-store with Pinia
- [ ] Set up IndexedDB schema with Dexie
- [ ] Create basic component structure
- [ ] Implement file upload UI

### Phase 2: Core Processing
- [ ] Implement CSV parsing logic
- [ ] Create LCR calculation worker
- [ ] Add batch processing system
- [ ] Implement progress tracking
- [ ] Add data validation

### Phase 3: UI Enhancement
- [ ] Build provider management UI
- [ ] Create LCR strategy selector
- [ ] Implement markup configuration
- [ ] Add preview functionality
- [ ] Polish UI/UX

### Phase 4: Export & Polish
- [ ] Implement CSV export
- [ ] Add comprehensive error handling
- [ ] Optimize performance
- [ ] Write tests
- [ ] Documentation

## Questions and Considerations

1. **Rate Type Handling**: Should we allow different LCR strategies for interstate vs intrastate rates?
2. **Provider Limits**: Should we enforce the 5-provider limit or make it configurable?
3. **Data Retention**: How long should we keep uploaded data in IndexedDB?
4. **Export Templates**: Do we need predefined export templates for different systems?
5. **Batch Processing**: What's the optimal batch size for processing without blocking the UI?

## Conclusion

This implementation plan provides a comprehensive blueprint for adding the Rate Generation feature to the factor-pricing application. By following existing patterns and leveraging the current infrastructure, we can ensure seamless integration while maintaining code quality and performance standards.

The modular architecture allows for incremental development and testing, with clear separation of concerns between data processing, UI, and business logic. The use of web workers and batch processing ensures the application remains responsive even with large datasets.

Next steps:
1. Review and approve this implementation plan
2. Set up the development branch
3. Begin Phase 1 implementation
4. Regular code reviews and testing
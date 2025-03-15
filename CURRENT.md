# LERG Services Refactoring Plan

## Overview

This document outlines a step-by-step plan to refactor the LERG services (`lerg.service.ts` and `lerg-api.service.ts`) to improve separation of concerns, reduce redundancy, and ensure proper coordination between the services while maintaining all existing functionality.

## Current Issues

1. Overlapping responsibilities between services
2. Potential race conditions in database connection management
3. Inconsistent singleton pattern implementation
4. Redundant data processing
5. Unclear boundaries of responsibility

## Implementation Steps

### Phase 1: Preparation and Analysis

- [x] **1.1** ~~Create unit tests for existing functionality to ensure refactoring doesn't break anything~~ (Skipped for now)
- [x] **1.2** Document all public methods and their usage across the application
- [x] **1.3** Identify all components that depend on these services

#### 1.2 Public Methods Documentation

##### LergService Methods

| Method | Purpose | Parameters | Return Type | Used By |
|--------|---------|------------|------------|---------|
| `initializeDB()` | Gets or creates a Dexie database instance | None | `Promise<Dexie>` | Internal methods, not directly called from outside |
| `initializeLergTable(lergData)` | Initializes the LERG table with data | `lergData: LERGRecord[]` | `Promise<void>` | `lergApiService.initialize()` |
| `getLergData()` | Retrieves all LERG records from IndexedDB | None | `Promise<LERGRecord[]>` | Not directly used outside |
| `clearLergData()` | Clears all LERG data from IndexedDB and store | None | `Promise<void>` | `lergApiService.initialize()`, `AdminView.vue` |
| `processLergData()` | Processes raw LERG data into application format | None | `Promise<{stateMapping, countryData}>` | `lergApiService.initialize()`, `AdminView.vue` |

##### LergApiService Methods

| Method | Purpose | Parameters | Return Type | Used By |
|--------|---------|------------|------------|---------|
| `checkLergDataExists()` | Checks if LERG data exists in IndexedDB | None | `Promise<{exists: boolean, count: number}>` | `AdminView.vue` |
| `initialize()` | Initializes the LERG service and data | None | `Promise<void>` | `AdminView.vue` |
| `testConnection()` | Tests connection to the LERG API | None | `Promise<boolean>` | `AdminView.vue` |
| `getLergData()` | Fetches LERG data from the server | None | `Promise<{data: LERGRecord[], stats: any}>` | Internal to `lergApiService.initialize()` |
| `uploadLergFile(formData)` | Uploads a LERG file to the server | `formData: FormData` | `Promise<any>` | `AdminView.vue` |
| `clearAllData()` | Clears all LERG data from server and client | None | `Promise<void>` | `AdminView.vue` |

#### 1.3 Component Dependencies

The following components directly depend on the LERG services:

1. **AdminView.vue** (formerly AdminLergView.vue)
   - Uses `lergApiService.initialize()` to load LERG data
   - Uses `lergApiService.checkLergDataExists()` to check for existing data
   - Uses `lergApiService.testConnection()` to check connection status
   - Directly creates a `LergService` instance to process data
   - Uses `lergApiService.uploadLergFile()` to upload LERG files
   - Uses `lergApiService.clearAllData()` to clear LERG data

2. **DashBoard.vue**
   - Indirectly depends on LERG data through the `useLergStore`

3. **LergStore (useLergStore.ts)**
   - Stores processed LERG data
   - Provides state management for LERG data
   - Used by both services to update application state

4. **DBStore (useDBStore.ts)**
   - Manages database connections
   - Used by `lergApiService` to close connections

#### Key Observations

1. **Circular Dependencies**:
   - `lergApiService` creates and uses a `LergService` instance
   - `AdminView.vue` sometimes bypasses `lergApiService` and directly creates a `LergService`

2. **Inconsistent Access Patterns**:
   - Some components use `lergApiService` as a facade
   - Others directly interact with both services

3. **Store Integration**:
   - Both services update the store directly
   - No centralized store update mechanism

4. **Component Consolidation**:
   - AdminLergView.vue has been renamed to AdminView.vue, consolidating LERG management functionality into a single admin view

These findings will guide our refactoring efforts in the subsequent phases.

### Phase 2: Refactor LergService (Database Layer)

- [ ] **2.1** Make `LergService` a proper singleton
  - [ ] **2.1.1** Add static instance property and getInstance method
  - [ ] **2.1.2** Make constructor private
  - [ ] **2.1.3** Update all references to use getInstance

- [ ] **2.2** Improve database connection management
  - [ ] **2.2.1** Centralize open/close operations
  - [ ] **2.2.2** Add connection state tracking
  - [ ] **2.2.3** Implement connection reference counting

- [ ] **2.3** Enhance error handling
  - [ ] **2.3.1** Add consistent error types
  - [ ] **2.3.2** Improve error messages
  - [ ] **2.3.3** Add retry logic for transient errors

- [ ] **2.4** Optimize data processing methods
  - [ ] **2.4.1** Refactor `processLergData` for better performance
  - [ ] **2.4.2** Add caching for processed data
  - [ ] **2.4.3** Implement incremental processing for large datasets

### Phase 3: Refactor LergApiService (API Layer)

- [ ] **3.1** Focus on API communication responsibilities
  - [ ] **3.1.1** Remove database operation logic
  - [ ] **3.1.2** Enhance API error handling
  - [ ] **3.1.3** Add request caching

- [ ] **3.2** Improve coordination with LergService
  - [ ] **3.2.1** Use LergService singleton properly
  - [ ] **3.2.2** Remove redundant singleton management
  - [ ] **3.2.3** Clarify initialization flow

- [ ] **3.3** Enhance data synchronization
  - [ ] **3.3.1** Add versioning for data synchronization
  - [ ] **3.3.2** Implement differential updates
  - [ ] **3.3.3** Add conflict resolution

### Phase 4: Create a Unified Interface

- [ ] **4.1** Create a facade service that coordinates both services
  - [ ] **4.1.1** Define clear public API
  - [ ] **4.1.2** Hide implementation details
  - [ ] **4.1.3** Provide simplified methods for common operations

- [ ] **4.2** Update store integration
  - [ ] **4.2.1** Centralize store updates
  - [ ] **4.2.2** Implement reactive data patterns
  - [ ] **4.2.3** Add proper loading states

### Phase 5: Implementation and Testing

- [ ] **5.1** Implement changes incrementally
  - [ ] **5.1.1** Start with LergService refactoring
  - [ ] **5.1.2** Then refactor LergApiService
  - [ ] **5.1.3** Finally implement the facade

- [ ] **5.2** Test thoroughly
  - [ ] **5.2.1** Run unit tests
  - [ ] **5.2.2** Perform integration testing
  - [ ] **5.2.3** Test edge cases (network failures, database errors)

- [ ] **5.3** Update documentation
  - [ ] **5.3.1** Update inline documentation
  - [ ] **5.3.2** Create service architecture documentation
  - [ ] **5.3.3** Document usage patterns

## Detailed Implementation Guide

### Step 2.1: Make LergService a Proper Singleton

```typescript
// lerg.service.ts
export class LergService {
  private static instance: LergService | null = null;
  private db: Dexie | null = null;
  private store = useLergStore();

  // Make constructor private
  private constructor() {
    console.log('Initializing LERG service');
  }

  // Static method to get the instance
  public static getInstance(): LergService {
    if (!LergService.instance) {
      LergService.instance = new LergService();
    }
    return LergService.instance;
  }

  // Rest of the class...
}
```

### Step 2.2: Improve Database Connection Management

```typescript
// lerg.service.ts (partial)
export class LergService {
  // ... other code

  private connectionCount = 0;
  private isConnecting = false;
  
  async getConnection(): Promise<Dexie> {
    if (!this.db) {
      const { getDB } = useDexieDB();
      this.db = await getDB(DBName.LERG);
    }
    
    if (!this.db.isOpen() && !this.isConnecting) {
      this.isConnecting = true;
      try {
        await this.db.open();
        console.log('LERG database connection opened');
      } finally {
        this.isConnecting = false;
      }
    }
    
    this.connectionCount++;
    return this.db;
  }
  
  async releaseConnection(): Promise<void> {
    if (!this.db) return;
    
    this.connectionCount--;
    
    // Only close if no active connections and not in the middle of an operation
    if (this.connectionCount <= 0 && this.db.isOpen()) {
      this.connectionCount = 0;
      await this.db.close();
      console.log('LERG database connection closed');
    }
  }
  
  // Use these methods in all other methods that need database access
}
```

### Step 3.1: Focus LergApiService on API Communication

```typescript
// lerg-api.service.ts (partial)
export const lergApiService = {
  async fetchLergData() {
    try {
      const response = await fetch(`${PUBLIC_URL}/lerg-data`);
      if (!response.ok) throw new Error('Failed to fetch LERG data');
      return response.json();
    } catch (error) {
      console.error('Failed to fetch LERG data:', error);
      throw error;
    }
  },
  
  // Other API methods...
}
```

### Step 4.1: Create a Unified Interface

```typescript
// lerg-facade.service.ts
import { LergService } from './lerg.service';
import { lergApiService } from './lerg-api.service';
import { useLergStore } from '@/stores/lerg-store';

export const lergFacadeService = {
  async initialize(): Promise<void> {
    const store = useLergStore();
    
    try {
      store.isProcessing = true;
      
      // Check if data already exists
      const hasLocalData = await this.hasLocalData();
      
      if (hasLocalData) {
        await this.loadFromLocal();
      } else {
        await this.loadFromServer();
      }
    } catch (error) {
      console.error('LERG initialization failed:', error);
      store.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      store.isProcessing = false;
    }
  },
  
  async hasLocalData(): Promise<boolean> {
    const lergService = LergService.getInstance();
    return await lergService.hasData();
  },
  
  async loadFromLocal(): Promise<void> {
    const lergService = LergService.getInstance();
    const store = useLergStore();
    
    const { stateMapping, countryData, count } = await lergService.getProcessedData();
    
    store.setStateNPAs(stateMapping);
    store.setCountryData(countryData);
    store.setLergStats(count);
    store.isLocallyStored = true;
  },
  
  async loadFromServer(): Promise<void> {
    const lergService = LergService.getInstance();
    const store = useLergStore();
    
    const lergData = await lergApiService.fetchLergData();
    
    if (!lergData.data || lergData.data.length === 0) {
      console.warn('No LERG data received from server');
      return;
    }
    
    await lergService.initializeLergTable(lergData.data);
    
    const { stateMapping, countryData } = await lergService.processLergData();
    
    store.setStateNPAs(stateMapping);
    store.setCountryData(countryData);
    store.setLergStats(lergData.stats?.totalRecords || lergData.data.length);
    store.isLocallyStored = true;
  },
  
  // Other unified methods...
}
```

## Migration Strategy

1. Implement changes one service at a time
2. Start with the most isolated changes
3. Test thoroughly after each step
4. Update component usage gradually
5. Keep backward compatibility until migration is complete

## Rollback Plan

1. Keep backup of original files
2. Implement feature flags to toggle between old and new implementations
3. Monitor for errors after each deployment
4. Be prepared to revert to previous version if critical issues arise

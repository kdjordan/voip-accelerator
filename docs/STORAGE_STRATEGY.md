# Hybrid Storage Strategy Documentation

## Overview

The hybrid storage strategy implementation provides a configurable approach to data storage in the application, allowing seamless switching between in-memory storage (using Pinia store) and IndexedDB storage (using DexieJS). This hybrid approach helps optimize performance and memory usage based on user needs and device capabilities.

## Architecture

The implementation follows the Strategy design pattern, which enables selecting an algorithm at runtime. In our case, this allows dynamically choosing between memory-based and persistent storage options.

### Core Components

1. **Storage Configuration (`src/config/storage-config.ts`)**: 
   - Defines configuration options for the storage strategy
   - Controls which storage mechanism is active
   - Sets memory thresholds and logging options

2. **Storage Strategy Interface (`src/services/storage/storage-strategy.ts`)**: 
   - Provides a unified interface for all storage implementations
   - Defines core methods for data manipulation
   - Includes base functionality shared across implementations

3. **Strategy Factory (`src/services/storage/storage-factory.ts`)**: 
   - Creates and returns appropriate storage strategy instances
   - Handles lazy loading of strategies
   - Manages strategy caching to avoid unnecessary instantiations
   - Implements memory monitoring and auto-switching

4. **Storage Strategies**:
   - **Dexie Strategy (`src/services/storage/dexie-strategy.ts`)**: IndexedDB implementation using DexieJS
   - **Store Strategy (`src/services/storage/store-strategy.ts`)**: In-memory implementation using Pinia store

5. **UI Components**:
   - **MemoryMonitor (`src/components/common/MemoryMonitor.vue`)**: Displays memory usage and allows manual strategy switching
   - **StorageNotification (`src/components/common/StorageNotification.vue`)**: Notifies users when storage strategy changes

## Key Features

### Configurable Storage

Users can choose between:
- **Memory Storage**: Faster operation for smaller datasets
- **IndexedDB Storage**: Better for larger datasets and persistence

### Automatic Memory Monitoring

- Monitors JavaScript heap usage
- Automatically switches to IndexedDB when memory exceeds specified threshold
- Prevents application crashes due to excessive memory usage

### Performance Optimization

- Implements chunking for large datasets
- Provides pagination and filtering capabilities
- Includes performance metrics for comparison between strategies

### User Experience

- Transparent switching between strategies
- Notification system for strategy changes
- UI controls for manual strategy selection

## Usage Guide

### Basic Usage

In service classes:

```typescript
import { getStorageStrategy } from '@/services/storage/storage-factory';
import { DBName } from '@/types/app-types';

// Get the appropriate storage strategy
const storageStrategy = await getStorageStrategy<MyDataType>(DBName.MY_DB);

// Store data
await storageStrategy.storeData('myTable', myDataArray);

// Retrieve data
const data = await storageStrategy.getData('myTable');

// Count records
const count = await storageStrategy.getCount('myTable');

// Remove data
await storageStrategy.removeData('myTable');

// Clear all data
await storageStrategy.clearAllData();
```

### Advanced Features

#### Pagination and Filtering

```typescript
// Get paginated data
const pageData = await storageStrategy.getData('myTable', { 
  page: 2,
  pageSize: 50
});

// Get filtered data
const filteredData = await storageStrategy.getData('myTable', {
  filter: item => item.category === 'important'
});
```

#### Switching Strategies

```typescript
import { updateStorageConfig } from '@/config/storage-config';

// Switch to memory storage
updateStorageConfig({ storageType: 'memory' });

// Switch to IndexedDB storage
updateStorageConfig({ storageType: 'indexeddb' });
```

#### Memory Monitoring

```typescript
import { setupMemoryMonitoring } from '@/services/storage/storage-factory';
import { updateStorageConfig } from '@/config/storage-config';

// Enable auto-fallback on memory pressure
updateStorageConfig({
  autoFallbackOnMemoryPressure: true,
  memoryThresholdMB: 350
});

// Initialize memory monitoring
setupMemoryMonitoring();
```

## Integration Examples

### AZ Module

The AZ module has been updated to use the hybrid storage approach:

1. `AZService` uses the storage factory to get the appropriate strategy
2. `AZFileUploads.vue` component allows toggling between strategies
3. Report generation works with both strategies

### US Module

The US module follows the same pattern:

1. `USService` implements storage strategy support
2. `USFileUploads.vue` component provides UI for strategy toggling
3. All functionality works seamlessly with both strategies

## Performance Considerations

- **Memory Storage**:
  - Faster for small to medium datasets (typically 2-5x faster for reads)
  - Limited by available browser memory
  - Best for development and testing

- **IndexedDB Storage**:
  - Better for large datasets (>10,000 records)
  - Persists data across page refreshes
  - More suitable for production use

## Troubleshooting

Common issues and solutions:

1. **High Memory Usage**: If the application shows high memory usage with in-memory storage, consider:
   - Switching to IndexedDB storage
   - Enabling automatic memory monitoring
   - Reducing the dataset size

2. **Slow Performance**: If IndexedDB operations are slow:
   - Check browser IndexedDB implementation
   - Verify chunking is working correctly
   - Consider using smaller transaction sizes

3. **Storage Strategy Events**: Listen for storage strategy change events:
   ```javascript
   window.addEventListener('storage-strategy-changed', (event) => {
     console.log('Storage strategy changed:', event.detail);
   });
   ```

## Technical Details

### Storage Strategy Interface

```typescript
export interface StorageStrategy<T> {
  initialize(): Promise<void>;
  storeData(tableName: string, data: T[]): Promise<void>;
  getData(tableName: string, options?: DataRetrievalOptions<T>): Promise<T[] | null>;
  removeData(tableName: string): Promise<void>;
  clearAllData(): Promise<void>;
  getCount(tableName: string): Promise<number>;
  listTables(): Promise<{ tableName: string; recordCount: number }[]>;
}
```

### Data Retrieval Options

```typescript
export interface DataRetrievalOptions<T> {
  page?: number;
  pageSize?: number;
  filter?: (item: T) => boolean;
}
```

## Future Improvements

Potential enhancements for the hybrid storage implementation:

1. **Improved Memory Estimation**: Develop more accurate memory usage estimation for large objects
2. **Offline Support**: Enhance IndexedDB strategy with offline capabilities
3. **Data Compression**: Implement compression for memory storage to reduce footprint
4. **Cross-Tab Synchronization**: Add support for synchronizing data across browser tabs
5. **Encryption**: Add optional encryption for sensitive data

## Conclusion

The hybrid storage strategy provides a flexible, efficient approach to data management in the application. By supporting both in-memory and IndexedDB storage options, it allows optimizing for different use cases and device capabilities while maintaining a consistent API. 
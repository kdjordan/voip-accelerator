# Implementation Plan: Move File Stats to AZ Store

## Current State
- File stats (totalCodes, totalDestinations, uniqueDestinationsPercentage) are currently stored locally in AZFileUploads.vue
- Stats are calculated when a file is uploaded and when a component is mounted
- The functionality should be moved to the az-store for persistence

## Implementation Steps

### 1. Update az-store.ts
- [x] Add fileStats state to the store
```typescript
fileStats: new Map<string, {
  totalCodes: number;
  totalDestinations: number;
  uniqueDestinationsPercentage: number;
}>(),
```
- [x] Add getters for file stats
```typescript
getFileStats: state => (componentId: string) => {
  return state.fileStats.get(componentId) || {
    totalCodes: 0,
    totalDestinations: 0,
    uniqueDestinationsPercentage: 0
  };
},
```
- [x] Add actions to update file stats
```typescript
setFileStats(componentId: string, stats: {
  totalCodes: number;
  totalDestinations: number;
  uniqueDestinationsPercentage: number;
}) {
  this.fileStats.set(componentId, stats);
},

clearFileStats(componentId: string) {
  this.fileStats.delete(componentId);
},

clearAllFileStats() {
  this.fileStats.clear();
},
```
- [x] Update the `removeFile` action to also clear file stats
- [x] Update the `resetFiles` action to clear all file stats

### 2. Update az.service.ts
- [x] Move the file stats calculation logic from AZFileUploads.vue to az.service.ts
- [x] Enhance the `generateSingleFileReport` method to also update file stats in the store
```typescript
async calculateFileStats(componentId: string, fileName: string): Promise<void> {
  try {
    const tableName = fileName.toLowerCase().replace('.csv', '');
    const data = await this.getData(tableName);
    
    if (!data || data.length === 0) return;
    
    // Calculate stats
    const totalCodes = data.length;
    const uniqueDestinations = new Set(data.map(item => item.destName)).size;
    const uniquePercentage = ((uniqueDestinations / totalCodes) * 100).toFixed(2);
    
    // Update store
    this.store.setFileStats(componentId, {
      totalCodes,
      totalDestinations: uniqueDestinations,
      uniqueDestinationsPercentage: parseFloat(uniquePercentage)
    });
  } catch (error) {
    console.error('Error calculating file stats:', error);
  }
}
```
- [x] Call this method after file processing in `processFile`
- [x] Update the `removeTable` method to also clear file stats for the removed file

### 3. Update AZFileUploads.vue
- [x] Remove the local fileStats reactive object
- [x] Replace all references to the local fileStats with calls to the store getter
- [x] Remove the `loadSingleFileStats` function
- [x] Remove the watch for hasSingleFileReport
- [x] Update the `handleFileUploaded` method to remove the call to `loadSingleFileStats`
- [x] Remove the call to `loadSingleFileStats` in the `onMounted` hook

### 4. Extract Code Summary to a Separate Component
- [x] Create a new component `AzCodeSummary.vue` that accepts a componentId prop
- [x] Move the code report UI from AZFileUploads.vue to the new component
- [x] Update AZFileUploads.vue to use the new component for both az1 and az2

### 5. Testing
- [x] Test uploading a file and verify stats are displayed correctly
  - Fixed an issue where the component ID was incorrectly determined in the processFile method
  - Updated the DomainStore interface to include fileStats methods to fix TypeScript errors
- [x] Test removing a file and verify stats are cleared
  - Fixed the handleRemoveFile function in AZFileUploads.vue to pass the fileName instead of componentId
  - Enhanced the removeFile method in az-store.ts to properly clean up all related data
- [x] Test uploading multiple files and verify stats for each file are maintained separately
  - Updated the Dashboard.vue to detect and display fileStats data in the database tables section
  - Added support for detecting fileStats in both az-store and us-store (future implementation)
- [ ] Test page refresh and verify stats persist

## Benefits
- File stats will be persistent across component mounts
- Logic for calculating stats will be centralized in the service
- Component will be simplified with less local state
- Better separation of concerns with data management in the store and UI in the component
- Improved code organization with a dedicated component for the code summary

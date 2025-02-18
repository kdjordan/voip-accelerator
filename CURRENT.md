# Current Development Task: Add Preview Functionality to LERG Upload

## Objective

Add file preview and column selection functionality to the LERG file upload process, matching the functionality in AZFileUploads.vue

## Required LERG Column Roles

- NPA
- NXX
- State
- Country

## Components to Modify

### 1. Types (lerg-types.ts)

- [x] Define LERG column roles
- [x] Add LERG_COLUMN_ROLE_OPTIONS constant
- [x] Add LergColumnRole type
- [x] Add LergPreviewData interface
- [x] Add LergColumnMapping interface

### 2. Store (lerg-store.ts)

- [ ] Add preview data handling
- [ ] Add column mapping functionality
- [ ] Add journey state management
- [ ] Add preview data state
- [ ] Add column mapping state
- [ ] Add methods for handling preview data
- [ ] Add methods for handling column mapping

### 3. UI (AdminLergView.vue)

- [ ] Update upload zone styling to match AZFileUploads.vue
- [ ] Modify handleLergFileChange to include preview step
- [ ] Add PreviewModal integration
- [ ] Add hover effects and loading states
- [ ] Add isDragging state
- [ ] Add file upload status handling
- [ ] Add preview modal state management

## Implementation Steps

1. [x] Define types and interfaces
2. [ ] Expand store functionality
3. [ ] Update UI components
4. [ ] Test and verify functionality

## Implementation Order

1. [x] Define LERG column roles and types
2. [ ] Update LERG store with preview functionality
3. [ ] Add preview modal to AdminLergView
4. [ ] Update file upload handler
5. [ ] Add upload zone styling
6. [ ] Test full upload flow

## Files to Modify

- [x] client/src/types/lerg-types.ts
- client/src/stores/lerg-store.ts
- client/src/pages/AdminLergView.vue
- client/src/constants/lerg-messages.ts (new file for journey messages)

## Reference Components

- client/src/components/az/AZFileUploads.vue (for upload functionality)
- client/src/components/shared/PreviewModal.vue (for preview functionality)

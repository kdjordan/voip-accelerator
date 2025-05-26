# US Table Components Refactoring Plan

## High Impact Opportunities

## Files that share these functionalities : @USDetailedComparison.vue and @USRateSheetTable.vue

### 1. Data Loading & Filtering Composable (`useTableData`) ✅

- **Status**: COMPLETED
- **Implementation Details**:

  - Created base composable `useTableData` with generic table data management
  - Created US-specific extension `useUSTableData` with state fetching and region sorting
  - Successfully refactored both components to use composables
  - Achieved ~300 lines reduction per component
  - Added type safety with `FilterFunction<T>` and `UseTableDataConfig<T>`
  - Implemented complete pagination system within the composable

- **Original Scope**:

  - ✅ Database initialization and connection management
  - ✅ Data fetching with filter application
  - ✅ Loading states (initial, filtering, pagination)
  - ✅ Error handling and recovery
  - ✅ Filter combinations and application
  - ✅ Consistent data transformation
  - ✅ Complete pagination functionality:
    - Page navigation (next, previous, first, last)
    - Items per page selection
    - Direct page input handling
    - Pagination state management
    - Loading states during page changes

- **Benefits Achieved**:
  - Centralized database connection management
  - Unified pagination and sorting logic
  - Type-safe filter function creation
  - Consistent error handling across components
  - Improved code maintainability
  - Reduced duplication
  - Better state management
  - Complete pagination system with type safety

### 2. Table Header & Sorting System (`useTableSort` + `TableHeader`)

- **Current State**: Duplicated sorting logic and header rendering
- **Impact**: High (200+ lines reduction per component)
- **Scope**:
  - Sort direction management
  - Sort key tracking and validation
  - Header click handlers
  - DB vs client-side sort determination
  - Reusable header component with sort indicators
  - Type-safe sort configuration

### 3. ~~Pagination System (`usePagination` + `TablePagination`)~~ ✅

- **Status**: COMPLETED (Merged into Section 1)
- **Implementation Details**:
  - Functionality fully implemented as part of `useTableData`
  - All pagination features included in base composable
  - Achieved line reduction goal (~150 lines per component)
  - UI component extraction still pending (can be part of Section 7)

## Medium Impact Opportunities

### 4. Average Calculations (`useAverages`)

- **Current State**: Similar calculation patterns with slight variations
- **Impact**: Medium (100+ lines reduction per component)
- **Scope**:
  - Average calculation logic
  - Animated transitions
  - Full dataset vs page-level calculations
  - Type-safe average configuration

### 5. Filter Management (`useTableFilters`)

- **Current State**: Similar filter patterns with component-specific logic
- **Impact**: Medium (100+ lines reduction per component)
- **Scope**:
  - Filter state management
  - Debounced updates
  - Filter combinations
  - Reset functionality
  - Filter type definitions

### 6. Region Selection (`useRegionSelect`)

- **Current State**: Duplicated region handling logic
- **Impact**: Medium (80+ lines reduction per component)
- **Scope**:
  - Available regions fetching
  - Region grouping logic
  - Region display formatting
  - Region type safety

## Lower Impact Opportunities

### 7. Shared UI Components

- **Current State**: Repeated UI patterns
- **Impact**: Low-Medium (50+ lines reduction per component)
- **Components to Create**:
  - `TableLoadingOverlay`
  - `TableEmptyState`
  - `TableFilters`
  - `TableHeader` (part of sorting system)
  - `TablePagination` (moved from Section 3, UI component only)

### 8. Error Handling (`useTableErrors`)

- **Current State**: Similar error patterns
- **Impact**: Low (30+ lines reduction per component)
- **Scope**:
  - Error state management
  - Error display consistency
  - Error recovery patterns
  - Type-safe error handling

## Implementation Strategy

1. ✅ Start with high-impact, self-contained systems:

   - ✅ Data loading system (most complex but highest value)
   - ✅ Pagination system (implemented as part of data loading)
   - Sorting system (clear boundaries)

2. Move to medium-impact features:

   - Average calculations
   - Filter management
   - Region selection

3. Finally, implement lower-impact improvements:
   - Shared UI components
   - Error handling system

## Expected Outcomes

- **Code Reduction**: ~1000 lines per component
  - ✅ Section 1: ~300 lines reduced
  - ✅ Section 3: ~150 lines (completed with Section 1)
  - Section 2: ~200 lines (pending)
  - Remaining: ~350 lines (pending)
- **Improved Maintainability**: Centralized logic in composables
- **Better Type Safety**: Consolidated type definitions
- **Easier Testing**: Isolated functionality
- **Faster Development**: Reusable components and composables

## Migration Plan

1. ✅ Create new composables/components without removing old code
2. ✅ Migrate one component at a time to new system
3. ✅ Test thoroughly after each migration
4. ✅ Remove old code once stable
5. ✅ Document new composables and components

## Progress Summary

### Completed (✅)

- Section 1: Data Loading & Filtering Composable
  - Base composable implementation
  - US-specific extension
  - Component refactoring
  - Testing and validation
  - Complete pagination system

### In Progress (🔄)

- None currently

### Pending (⏳)

- Section 2: Table Header & Sorting System
- Section 4: Average Calculations
- Section 5: Filter Management
- Section 6: Region Selection
- Section 7: Shared UI Components (including pagination UI)
- Section 8: Error Handling

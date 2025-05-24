# US Table Components Refactoring Plan

## High Impact Opportunities

### 1. Data Loading & Filtering Composable (`useTableData`)

- **Current State**: Duplicated across components, complex logic intertwined
- **Impact**: Very High (300+ lines reduction per component)
- **Scope**:
  - Database initialization and connection management
  - Data fetching with filter application
  - Loading states (initial, filtering, pagination)
  - Error handling and recovery
  - Filter combinations and application
  - Consistent data transformation

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

### 3. Pagination System (`usePagination` + `TablePagination`)

- **Current State**: Identical pagination code in both components
- **Impact**: High (150+ lines reduction per component)
- **Scope**:
  - Page navigation (next, previous, first, last)
  - Items per page selection
  - Direct page input handling
  - Scroll behavior management
  - Loading states
  - Pagination UI component

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
  - `TablePagination` (part of pagination system)

### 8. Error Handling (`useTableErrors`)

- **Current State**: Similar error patterns
- **Impact**: Low (30+ lines reduction per component)
- **Scope**:
  - Error state management
  - Error display consistency
  - Error recovery patterns
  - Type-safe error handling

## Implementation Strategy

1. Start with high-impact, self-contained systems:

   - Pagination system (easiest to extract)
   - Sorting system (clear boundaries)
   - Data loading system (most complex but highest value)

2. Move to medium-impact features:

   - Average calculations
   - Filter management
   - Region selection

3. Finally, implement lower-impact improvements:
   - Shared UI components
   - Error handling system

## Expected Outcomes

- **Code Reduction**: ~1000 lines per component
- **Improved Maintainability**: Centralized logic in composables
- **Better Type Safety**: Consolidated type definitions
- **Easier Testing**: Isolated functionality
- **Faster Development**: Reusable components and composables

## Migration Plan

1. Create new composables/components without removing old code
2. Migrate one component at a time to new system
3. Test thoroughly after each migration
4. Remove old code once stable
5. Document new composables and components

# CSV Export System Enhancement Plan

## Overview

The current CSV export system needs to be made more flexible to handle different export contexts while maintaining backward compatibility. This document outlines the implementation plan for enhancing `useCSVExport.ts`.

## Current State Analysis

### Export Context 1: USRateSheetTable.vue (Single Rate Sheet)
- **Purpose**: Export filtered single rate sheet data with user adjustments
- **Data Structure**: Individual rate records with interstate/intrastate/indeterminate rates
- **Features**: Complex filtering (NPANXX, state, metro areas), rate adjustments, session tracking
- **Export Fields**: NPANXX, State, Country, Interstate Rate, Intrastate Rate, Indeterminate Rate, Effective Date
- **Status**:  Working correctly

### Export Context 2: USDetailedComparisonTable.vue (Rate Comparison)
- **Purpose**: Export comparison data between two different rate decks  
- **Data Structure**: Comparison records showing rate differences between files
- **Features**: Comparison filtering (cheaper file, rate differences)
- **Export Fields**: NPANXX, State, Country, File1 rates, File2 rates, Difference percentages, Cheaper file
- **Status**: L Needs flexible export system

## Implementation Plan

### Phase 1: Enhanced Core Interface (Backward Compatible)

#### Task Checklist:
- [ ] Extend `CSVExportOptions` interface with context-aware properties
- [ ] Add optional `exportContext` field ('rate-sheet' | 'comparison' | 'generic')
- [ ] Add `customHeaders` support for dynamic header generation
- [ ] Add `fieldTransformations` for context-specific data formatting
- [ ] Extend `CSVData` interface with optional metadata support
- [ ] Ensure all changes are backward compatible
- [ ] Add JSDoc documentation for new interfaces

#### Code Changes Required:
```typescript
// File: /client/src/composables/exports/useCSVExport.ts
export interface CSVExportOptions {
  filename: string;
  timestamp?: boolean;
  additionalNameParts?: string[];
  quoteFields?: boolean;
  // NEW: Export context configuration
  exportContext?: 'rate-sheet' | 'comparison' | 'generic';
  customHeaders?: string[];
  fieldTransformations?: Record<string, (value: any) => string>;
}

export interface CSVData {
  headers: string[];
  rows: any[];
  // NEW: Optional metadata for context-aware processing
  metadata?: {
    exportType?: string;
    sourceFiles?: string[];
    appliedFilters?: string[];
    adjustments?: any;
  };
}
```

### Phase 2: Context-Aware Export Functions

#### Task Checklist:
- [ ] Create `exportToCSVWithContext` function alongside existing `exportToCSV`
- [ ] Implement context routing logic (rate-sheet, comparison, generic)
- [ ] Ensure original `exportToCSV` function remains unchanged
- [ ] Add error handling for invalid contexts
- [ ] Add comprehensive unit tests for new functionality
- [ ] Verify backward compatibility with existing USRateSheetTable exports

#### Code Changes Required:
```typescript
// File: /client/src/composables/exports/useCSVExport.ts
export async function exportToCSVWithContext(
  data: CSVData,
  options: CSVExportOptions,
  context: ExportContext
): Promise<void> {
  // Context-specific processing logic
}

// Original function preserved for backward compatibility
export async function exportToCSV(data: CSVData, options: CSVExportOptions): Promise<void> {
  // Existing implementation unchanged
}
```

### Phase 3: Specialized Export Handlers

#### Task Checklist:
- [ ] Implement `handleRateSheetExport` function
- [ ] Implement `handleComparisonExport` function
- [ ] Add rate formatting with proper decimal places (6 for rates, 2 for percentages)
- [ ] Handle adjustment metadata for rate sheet exports
- [ ] Handle dual file naming for comparison exports
- [ ] Add session tracking info support
- [ ] Create context-specific filename generation
- [ ] Add validation for required context data

#### Code Changes Required:
```typescript
// File: /client/src/composables/exports/useCSVExport.ts
async function handleRateSheetExport(
  data: CSVData, 
  options: CSVExportOptions,
  context: RateSheetContext
): Promise<void> {
  // Rate sheet specific logic
}

async function handleComparisonExport(
  data: CSVData,
  options: CSVExportOptions, 
  context: ComparisonContext
): Promise<void> {
  // Comparison specific logic
}
```

### Phase 4: Enhanced Utility Functions

#### Task Checklist:
- [ ] Enhance `formatRate` function with context awareness
- [ ] Create `formatRateForExport` function with context parameter
- [ ] Create `formatPercentageForExport` function for comparison exports
- [ ] Add `formatCurrency` function for monetary values
- [ ] Update existing utility functions to support new contexts
- [ ] Add comprehensive JSDoc documentation
- [ ] Create unit tests for all utility functions

#### Code Changes Required:
```typescript
// File: /client/src/composables/exports/useCSVExport.ts
export function formatRateForExport(
  rate: number | null | undefined, 
  context: 'rate-sheet' | 'comparison' = 'rate-sheet',
  decimals: number = 6
): string {
  // Context-aware rate formatting
}

export function formatPercentageForExport(
  percentage: number | null | undefined,
  decimals: number = 2
): string {
  // Percentage formatting with % suffix
}
```

### Phase 5: Component Integration

#### Task Checklist:
- [ ] Update USRateSheetTable.vue to use enhanced export (optional migration)
- [ ] Update USDetailedComparisonTable.vue to use context-aware exports
- [ ] Test backward compatibility with existing USRateSheetTable exports
- [ ] Verify all filter combinations work correctly
- [ ] Test export functionality with large datasets
- [ ] Add error handling for export failures
- [ ] Update component JSDoc documentation

### Phase 6: Testing & Validation

#### Task Checklist:
- [ ] Create unit tests for all new functions
- [ ] Create integration tests for component exports
- [ ] Test backward compatibility thoroughly
- [ ] Test with real data from both export contexts
- [ ] Performance testing with large datasets
- [ ] Browser compatibility testing
- [ ] Error scenario testing
- [ ] User acceptance testing

## File Changes Required

### Primary Files:
- `/client/src/composables/exports/useCSVExport.ts` - Core export functionality
- `/client/src/components/rate-sheet/us/USRateSheetTable.vue` - Optional migration
- `/client/src/components/us/USDetailedComparisonTable.vue` - Required updates

### Supporting Files:
- `/client/src/composables/exports/useUSExportConfig.ts` - May need updates
- Test files for all modified components
- Type definition files if new interfaces are added

## Success Criteria

### Must Have:
- [ ] Existing USRateSheetTable.vue exports continue working unchanged
- [ ] USDetailedComparisonTable.vue exports work with new flexible system
- [ ] No breaking changes to existing API
- [ ] Comprehensive error handling
- [ ] Full backward compatibility

### Should Have:
- [ ] Improved performance for large exports
- [ ] Better error messages for users
- [ ] Consistent export formatting across contexts
- [ ] Comprehensive unit test coverage
- [ ] Clear documentation for future developers

### Nice to Have:
- [ ] Export progress indicators
- [ ] Export cancellation support
- [ ] Multiple export format support (JSON, XML)
- [ ] Export templates for different use cases
- [ ] Export history/logging

## Risk Mitigation

### High Risk:
- **Breaking existing exports**: Maintain original function signatures
- **Performance degradation**: Optimize for existing use cases first
- **Complex context logic**: Keep context handlers simple and focused

### Medium Risk:
- **Inconsistent formatting**: Establish clear formatting rules per context
- **Memory usage with large datasets**: Implement streaming where possible
- **Browser compatibility**: Test across supported browsers

### Low Risk:
- **User confusion**: Maintain existing UI patterns
- **Maintenance burden**: Keep code well-documented and modular

## Timeline Estimate

- **Phase 1**: 1-2 days (Interface enhancements)
- **Phase 2**: 2-3 days (Context-aware functions)  
- **Phase 3**: 3-4 days (Specialized handlers)
- **Phase 4**: 2-3 days (Utility functions)
- **Phase 5**: 2-3 days (Component integration)
- **Phase 6**: 3-4 days (Testing & validation)

**Total Estimated Time**: 13-19 days

## Next Steps

1. Begin with Phase 1 implementation
2. Test backward compatibility after each phase
3. Get stakeholder approval before Phase 5
4. Conduct thorough testing before deployment
5. Monitor exports after deployment for any issues

---

*Last Updated*: 2025-07-22
*Document Version*: 1.0
*Status*: Planning Complete - Ready for Implementation
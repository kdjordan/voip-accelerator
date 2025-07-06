# US Export Enhancement Plan

## Overview
Enhance US-related CSV exports (US Rate Sheet and US Comparison) with an explicit confirmation modal that shows applied filters and provides formatting options to accommodate different switch requirements.

## Goals
1. Prevent accidental incomplete exports due to unnoticed filters
2. Provide flexible formatting options for different switch systems
3. Make exports more user-friendly and error-proof
4. Leverage existing filter functionality with explicit user confirmation

## Proposed Solution

### 1. Export Configuration Modal
Create a new modal component that appears when users click export:

#### Modal Sections:

**A. Active Filters Summary**
- Display all currently applied filters:
  - States selected/excluded
  - NPANXX search terms
  - Metro areas
  - Countries included/excluded
  - Rate type filters
- Show record count that will be exported
- Warning if filters are reducing the dataset

**B. Format Options**
- **NPANXX Format:**
  - [ ] Combined NPANXX (default)
  - [ ] Split into NPA and NXX columns
  
- **Country Code Format:**
  - [ ] Include (1) prefix for North American numbers
  - [ ] Exclude (1) prefix
  - [ ] Add separate country code column

- **Additional Options:**
  - [ ] Include only specific countries (with multi-select)
  - [ ] Exclude specific countries
  - [ ] Include state abbreviation column
  - [ ] Include metro area column (if applicable)

**C. Export Preview**
- Show first 5-10 rows with selected formatting
- Display column headers based on options selected

### 2. Component Structure

```
components/
  exports/
    USExportModal.vue          # Main modal component
    USExportPreview.vue        # Preview table component
    USExportFilters.vue        # Active filters summary
    USExportFormatOptions.vue  # Format configuration
```

### 3. Implementation Details

#### Data Flow:
1. User clicks "Export" button
2. Modal opens with current filter state
3. User reviews filters and selects format options
4. Preview updates dynamically
5. User confirms or cancels export
6. Export proceeds with selected options

#### State Management:
- Create `useUSExportConfig` composable to manage:
  - Format preferences (persisted to localStorage)
  - Active export configuration
  - Preview data generation

#### Integration Points:
- Modify existing export functions in:
  - `USRateSheetTable.vue`
  - `USDetailedComparisonTable.vue`
- Update `useCSVExport` composable to handle new column structures

### 4. User Experience Flow

```
[Export Button] → [Configuration Modal]
                          ↓
                  [Active Filters Summary]
                  "2,450 records will be exported"
                  "Filtered by: CA, FL states"
                          ↓
                  [Format Options]
                  ☑ Split NPA/NXX
                  ☐ Include (1) prefix
                          ↓
                  [Preview Table]
                  NPA | NXX | State | Rate...
                  213 | 555 | CA    | $0.002
                          ↓
                  [Cancel] [Export CSV]
```

### 5. Benefits
- **Transparency**: Users see exactly what data they're exporting
- **Flexibility**: Different formats for different switch systems
- **Error Prevention**: No accidental partial exports
- **Consistency**: Reusable across all US export scenarios

### 6. Future Enhancements
- Save format presets for different switch types
- Bulk export with multiple format outputs
- Export history/audit trail
- API endpoint for programmatic exports

## Technical Considerations

### Breaking Changes
- None - existing export functionality remains with added modal step

### Performance
- Preview generation should be lightweight (first 10 rows only)
- Format transformations applied during export, not in preview

### Testing
- Unit tests for format transformations
- E2E tests for modal flow
- Verify all format combinations produce valid CSV

## Implementation Priority
1. Basic modal with filter display
2. NPANXX split functionality
3. Country code options
4. Preview functionality
5. Additional format options
6. Saved presets (future)
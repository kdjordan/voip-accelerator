# NANP Single Source of Truth Migration Plan

## Overview
This document outlines the incremental migration from scattered NANP data sources (constants, hardcoded arrays, partial LERG data) to a single authoritative enhanced LERG database in Supabase.

## Current State Analysis

### Existing Data Sources (To Be Consolidated)
- [ ] `/src/types/constants/state-codes.ts` - US state mappings
- [ ] `/src/types/constants/province-codes.ts` - Canadian province mappings  
- [ ] `/src/types/constants/country-codes.ts` - NANP country mappings
- [ ] `/src/utils/nanp-categorization.ts` - Hardcoded NPA arrays (incomplete)
- [ ] Supabase LERG table - Basic NPA/state/country data
- [ ] Various `getStateName()`, `getCountryName()` helper functions

### Systems That Depend on Geographic Mappings
- [ ] US Rate Sheet upload and processing
- [ ] LERG Store state management
- [ ] NANP categorization for +1 detection
- [ ] Admin dashboard displays
- [ ] Export functionality

## Phase 1: Database Foundation (Backend Only)

### 1.1 Design Enhanced LERG Schema
- [ ] Document new table structure with all required fields
- [ ] Include country names, state/province names, regions, categories
- [ ] Plan for backward compatibility during migration

**Validation**: Schema reviewed and approved

### 1.2 Create Database Migration Script
- [ ] Write SQL to create enhanced_lerg table
- [ ] Include proper indexes for performance
- [ ] Add constraints for data integrity

**Validation**: Script runs successfully in test environment

### 1.3 Create Data Seeding Script
- [ ] Combine data from all existing constants files
- [ ] Map current LERG data to enhanced structure
- [ ] Handle special cases (XX for unknown provinces, etc.)

**Validation**: All known NPAs have complete geographic data

## Phase 2: Edge Function Updates (API Layer)

### 2.1 Create New Edge Functions
- [ ] `get-enhanced-lerg-data` - Returns full geographic context
- [ ] `add-enhanced-lerg-record` - Accepts complete location data
- [ ] `update-lerg-record` - For admin corrections
- [ ] Keep existing functions operational (backward compatibility)

**Validation**: New functions return expected enhanced data structure

### 2.2 Add Data Validation
- [ ] Validate country/state combinations (US states vs CA provinces)
- [ ] Ensure category matches country (caribbean, pacific, etc.)
- [ ] Reject invalid geographic combinations

**Validation**: Invalid data is properly rejected with clear errors

## Phase 3: Composable Layer (Frontend Integration)

### 3.1 Create Enhanced LERG Composable
- [ ] New `useEnhancedLERG.ts` composable
- [ ] Methods to fetch complete geographic data by NPA
- [ ] Caching strategy for performance
- [ ] Fallback to existing constants during transition

**Validation**: Composable returns full location data for any NPA

### 3.2 Update NANP Management Composable
- [ ] Modify to use enhanced LERG data
- [ ] Update category determination logic
- [ ] Remove hardcoded fallback arrays

**Validation**: 438 and 450 NPAs both correctly identified as Canadian

## Phase 4: Component Updates (UI Layer)

### 4.1 Update Admin Components First
- [ ] UnifiedNANPManagement.vue - Use enhanced data
- [ ] NANPDiagnostics.vue - Show full geographic context
- [ ] Add UI for viewing/editing complete location data

**Validation**: Admin can see and edit full geographic details

### 4.2 Update Display Components
- [ ] AdminView.vue - Use enhanced names directly from LERG
- [ ] Remove getStateName/getCountryName calls
- [ ] Update statistics calculations

**Validation**: All geographic names display correctly

## Phase 5: Store Updates (State Management)

### 5.1 Update LERG Store Gradually
- [ ] Add enhanced data fields to store interface
- [ ] Update getters to use new data structure
- [ ] Keep existing getters working with new data

**Validation**: Existing UI continues to work with enhanced store

### 5.2 Update US Rate Sheet Store
- [ ] Modify to expect enhanced LERG data
- [ ] Update any geographic lookups
- [ ] Ensure +1 detection uses new structure

**Validation**: US rate sheet uploads work correctly

## Phase 6: Migration and Cleanup

### 6.1 Data Migration
- [ ] Run seeding script in production
- [ ] Verify all NPAs have complete data
- [ ] Monitor for any missing mappings

**Validation**: No missing geographic data in production

### 6.2 Switch to New System
- [ ] Update all components to use enhanced LERG exclusively
- [ ] Remove fallback to constants
- [ ] Monitor for any errors

**Validation**: System runs without constants files

### 6.3 Remove Deprecated Code
- [ ] Delete old constants files (after verification period)
- [ ] Remove old helper functions
- [ ] Clean up unused imports

**Validation**: Build succeeds without constants

## Testing Checkpoints

### After Each Phase:
1. **Unit Tests**: Verify individual functions work correctly
2. **Integration Tests**: Ensure systems work together
3. **Manual Testing**: Admin can manage NPAs with full context
4. **Regression Testing**: Existing features still work

### Critical Test Cases:
- [ ] NPA 438 shows as Quebec, Canada
- [ ] NPA 450 shows as Quebec, Canada  
- [ ] US NPAs show state names correctly
- [ ] Caribbean NPAs categorized properly
- [ ] Unknown NPAs handled gracefully

## Rollback Strategy

### Phase-by-Phase Rollback:
- Each phase can be rolled back independently
- Old edge functions remain available
- Constants files kept until final verification
- Database changes are additive (non-destructive)

## Success Metrics

### Data Quality:
- [ ] 100% of NPAs have country names
- [ ] 100% of NPAs have state/province names
- [ ] No more hardcoded NPA lists
- [ ] Single source of truth achieved

### System Health:
- [ ] No increase in error rates
- [ ] Performance maintained or improved
- [ ] Admin operations simplified
- [ ] Code complexity reduced

## Timeline Estimate

- Phase 1: 1-2 days (Database foundation)
- Phase 2: 2-3 days (Edge functions)
- Phase 3: 1-2 days (Composables)
- Phase 4: 2-3 days (Components)
- Phase 5: 1-2 days (Stores)
- Phase 6: 1 day (Migration & cleanup)

**Total: 2-3 weeks with testing and validation**

## Notes

- Keep existing systems operational throughout migration
- Test thoroughly at each checkpoint
- Document any deviations from plan
- Communicate changes to team at each phase
# LERG Country/State Integration

## Overview

Integrate country information from LERG data to provide a single source of truth for NPA mappings, eliminating the need for separate special codes management.

## Implementation Steps

### 1. Database Schema Updates

- [x] Clean up migration files (consolidate in server/migrations)
- [x] Add country column to LERG table
- [x] Update migrations
- [x] Decision made: Remove special_codes functionality as it's redundant with LERG data

### 2. Cleanup Tasks

- [ ] Remove special_area_codes table
- [ ] Remove special codes seeder
- [ ] Remove special codes processor
- [ ] Remove special codes routes
- [ ] Update client to use LERG data for country/NPA mappings

### 3. Data Processing Updates

- [x] Modify LERG file processor to extract country data
<!-- 
### 4. Store/Service Updates

- [ ] Update LergState interface for country data
- [ ] Modify store actions and getters
- [ ] Update services to handle unified data

### 5. UI Updates

- [ ] Modify AdminLergView to show unified data
- [ ] Update special codes section to use LERG data
- [ ] Add country/state relationship display

### 6. Migration Path

- [ ] Plan deprecation of special codes
- [ ] Add data migration utilities
- [ ] Update documentation -->

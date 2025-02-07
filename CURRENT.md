# LERG Country/State Integration

## Overview

Integrate country information from LERG data to provide a single source of truth for NPA mappings, eliminating the need for separate special codes management.

## Implementation Steps

### 1. Database Schema Updates

- [x] Clean up migration files (consolidate in server/migrations)
- [x] Add country column to LERG table
- [x] Update migrations
- [ ] Consider deprecating special_area_codes table // we will see if we need to do this later

### 2. Data Processing Updates

- [x] Modify LERG file processor to extract country data
<!-- 
### 3. Store/Service Updates

- [ ] Update LergState interface for country data
- [ ] Modify store actions and getters
- [ ] Update services to handle unified data

### 4. UI Updates

- [ ] Modify AdminLergView to show unified data
- [ ] Update special codes section to use LERG data
- [ ] Add country/state relationship display

### 5. Migration Path

- [ ] Plan deprecation of special codes
- [ ] Add data migration utilities
- [ ] Update documentation -->

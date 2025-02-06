# LERG Country/State Integration

## Overview
Integrate country information from LERG data to provide a single source of truth for NPA mappings, eliminating the need for separate special codes management.

## Implementation Steps

### 1. Database Schema Updates
- [ ] Add country column to LERG table
- [ ] Update migrations
- [ ] Consider deprecating special_area_codes table

### 2. Data Processing Updates
- [ ] Modify LERG file processor to extract country data
- [ ] Update state worker to include country processing
- [ ] Add country/state relationship mapping

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
- [ ] Update documentation
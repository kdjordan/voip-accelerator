# Rate Sheet Formalizer Implementation

## Overview

Create a new feature to allow users to upload and process rate sheet CSV files, with client-side storage using IndexedDB. The tool will help formalize rates when a destination has multiple codes and potentially different rates.

## Implmentation notes

Use best practices for Vue 3 and act as senior developer. Use Tailwind for all css. Always check to see if we have a fuction available for the task - do not assume we have to write everything from scratch. Leverage existing components and functions whenever possible. Keep all types in type files - never in component code.
Always ask clarifying questions if you are confused or ave lost context.

## Required Column Roles

- [x] Destination Name
- [x] Code
- [x] Rate
- [x] Effective Date
- [x] Min Duration
- [x] Increments

_Note: All columns are required and can only map to one role_

## Core Components

### 1. Navigation & Routing

- [x] Add new icon to SideNav for Rate Sheet Formalizer
- [x] Create new route for the Rate Sheet view
- [ ] Implement route guards if needed

### 2. New View/Page

- [x] Create RateSheetView.vue
- [x] Implement drag-and-drop/file upload
- [ ] Display processed data results:
  - [ ] Implement expandable table view:
    - [ ] Show all destinations in main table
    - [ ] Visual indicator for destinations with rate discrepancies
    - [ ] Expandable rows for detailed rate information:
      - [ ] Show all codes for the destination
      - [ ] Display rate frequency statistics (count and percentage)
      - [ ] Rate selection interface for problematic destinations
    - [ ] Filter toggle for showing:
      - [ ] All destinations
      - [ ] Only destinations with rate issues
      - [ ] Only unified destinations
- [ ] Implement export functionality for formalized data

### 3. Data Management

- [x] Define new types for rate sheet data:
  - [x] RateSheetRecord interface
  - [x] RateSheetState interface
  - [x] GroupedRateData interface
  - [x] RateStatistics interface
- [x] Set up IndexedDB table using Dexie
- [x] Create rate sheet store
- [ ] Implement data processing functions:
  - [ ] Group by destination
  - [ ] Calculate rate frequencies with 6 decimal precision
  - [ ] Handle rate selection

### 4. File Processing

- [x] Restrict to CSV files only
- [x] Direct column mapping based on known format
- [x] Implement validation:
  - [x] Required fields present
  - [x] Valid rate format
  - [x] Valid duration format
  - [x] Valid increment format
- [x] Process CSV data into standardized format

### 5. UI/UX

- [x] Consistent styling with existing application
- [x] Clear feedback during upload/processing
- [ ] Error handling and user notifications
- [ ] Export functionality:
  - [ ] Export as CSV
  - [ ] Maintain exact format of original file
  - [ ] Apply selected rates to destinations
  - [ ] Preserve original date formats

## Data Structure

### IndexedDB Schema

```typescript
interface RateSheetRecord {
  name: string;
  prefix: string;
  rate: number; // Stored with 6 decimal precision
  effective: string; // Stored in original format
  minDuration: number;
  increments: number;
}
```

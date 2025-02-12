# AZ Rate Deck Refactor Task List

## Overview

Refactor AZ rate functionality to use Dexie.js properly with web workers for better performance and maintainability.

## Coding Standards

- Use TypeScript for all data types and functions - keep all types in the types folder, not in the components or services
- Use meaningful variable and function names
- Add comments to explain why behind the code in more complex functions
- Keep functions small and focused (single responsibility)
- Handle errors and edge cases gracefully

## Architectural Pattern

We follow a strict layered architecture based on the Rate Sheet implementation:

1. Services Layer (`/services`)

   - Business logic and data processing
   - Database operations via Dexie.js
   - Worker coordination
   - Framework agnostic

2. Composables Layer (`/composables`)

   - Vue-specific functionality
   - State management for components
   - File handling logic
   - Bridge between components and services

3. Store Layer (`/stores`)

   - Global state management via Pinia
   - Cross-component communication
   - Cache management

4. Component Layer (`/components`)
   - UI rendering only
   - Event handling
   - Uses composables for logic
   - No direct service calls

This architecture is NOT optional - all new features and refactoring must follow this pattern.

Key Challenges:

- Large file sizes (up to 100MB)
- Variable CSV formats requiring column mapping
- Intensive parsing and normalization operations
- Need for responsive UI during processing

## Component Architecture Refactor

2. Component Decoupling

   - [ ] Create type-specific upload components (AZUpload, USUpload)
   - [ ] Refactor PreviewModal to be type-agnostic
   - [ ] Remove type-specific logic from shared components

3. File Processing Strategy

   - [ ] Move CSV parsing logic to services
   - [ ] Implement service-specific validation
   - [ ] Create unified error handling approach
   - [ ] Add progress tracking per handler

## Core Infrastructure Tasks

1. Dexie.js Implementation

   - [ ] Review and update database schema
   - [ ] Implement chunked data storage for large datasets
   - [ ] Set up compound indexes for efficient querying
   - [ ] Configure optimal chunk size for bulk operations
   - [ ] Add bulk operations handling

2. Web Worker Setup

   - [ ] Create dedicated worker for CSV parsing
   - [ ] Implement streaming CSV parser for large files
   - [ ] Add chunked data processing
   - [ ] Set up worker message handling
   - [ ] Create progress calculation system
   - [ ] Implement progress reporting from workers

3. Data Flow Architecture
   - [ ] Define data flow between components
   - [ ] Implement streaming data pipeline
   - [ ] Set up Pinia store integration with Dexie
   - [ ] Add memory management for large datasets
   - [ ] Handle large dataset pagination

## Feature Implementation

1. File Upload & Processing

   - [ ] Add streaming file upload handling
   - [ ] Implement chunk-based CSV validation
   - [ ] Add progress indicators for:
     - File upload
     - Column mapping
     - Data processing
     - Database storage
   - [ ] Handle large file uploads
   - [ ] Implement error handling

2. Preview & Column Mapping

   - [ ] Optimize preview generation for large files
   - [ ] Add column auto-detection
   - [ ] Implement preview data sampling
   - [ ] Save/load column mapping presets
   - [ ] Add validation for required columns

3. Report Generation

   - [ ] Move report calculations to worker
   - [ ] Implement chunked report generation
   - [ ] Implement progress tracking
   - [ ] Add memory-efficient data aggregation
   - [ ] Handle report data export

## UI/UX Improvements

1. Loading States

   - [ ] Add progress indicators
   - [ ] Show detailed progress breakdowns:
     - Bytes processed
     - Records processed
     - Time remaining
   - [ ] Implement skeleton loaders
   - [ ] Add cancelable operations
   - [ ] Show processing status

2. Error Handling

   - [ ] Implement error boundaries
   - [ ] Add specific error handling for:
     - File size limits
     - Memory limitations
     - Invalid data formats
     - Failed column mapping
   - [ ] Create recovery mechanisms
   - [ ] Add validation feedback

3. Performance Optimizations
   - [ ] Implement virtual scrolling for large datasets
   - [ ] Add data pagination with cursor-based navigation
   - [ ] Optimize render performance with windowing
   - [ ] Add request debouncing for search/filter operations
   - [ ] Implement memory cleanup strategies

## Testing & Documentation

1. Testing

   - [ ] Unit tests for workers
   - [ ] Integration tests
   - [ ] Performance tests with large datasets
   - [ ] Memory leak tests
   - [ ] Error scenario tests

2. Documentation
   - [ ] API documentation
   - [ ] Worker communication docs
   - [ ] Data flow diagrams
   - [ ] Performance optimization guidelines
   - [ ] Memory management guidelines

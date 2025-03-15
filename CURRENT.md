# AZ View Refactoring Plan

## Overview
Currently, the AZ View requires users to upload two files and click "Get Reports" before they can see any analysis. We need to refactor this to show the code report immediately after a single file upload, improving the user experience and providing immediate feedback.

## Phase 1: Update Data Flow and Service Layer
- [ ] **1.1** Modify `az.service.ts` to process and analyze a single file
  - [ ] **1.1.1** Create a new method to generate a single-file code report
  - [ ] **1.1.2** Update the existing file processing logic to trigger report generation
  - [ ] **1.1.3** Ensure backward compatibility with two-file comparison

## Phase 2: Update Store and State Management
- [ ] **2.1** Update `az-store` to support single-file reports
  - [ ] **2.1.1** Add state for single-file reports
  - [ ] **2.1.2** Create getters for accessing single-file report data
  - [ ] **2.1.3** Modify the report generation logic to work with one or two files

## Phase 3: Update UI Components
- [ ] **3.1** Modify `AZFileUploads.vue` to show code report after upload
  - [ ] **3.1.1** Update the UI to show a "View Report" button after file upload
  - [ ] **3.1.2** Implement conditional rendering based on file upload status
  - [ ] **3.1.3** Maintain the existing two-file upload functionality

- [ ] **3.2** Update `AZCodeReport.vue` to handle single-file reports
  - [ ] **3.2.1** Modify the component to display data for one file when only one is available
  - [ ] **3.2.2** Add conditional rendering for comparison section (only show when two files are uploaded)
  - [ ] **3.2.3** Ensure all metrics are calculated correctly for single files

- [ ] **3.3** Update `AZContentHeader.vue` to reflect the new workflow
  - [ ] **3.3.1** Update the tab navigation to enable code report tab after single file upload
  - [ ] **3.3.2** Modify the reset functionality to work with the new flow
  - [ ] **3.3.3** Update journey messages to guide users through the new experience

- [ ] **3.4** Update `AZPricingReport.vue` to handle single-file scenario
  - [ ] **3.4.1** Add a message when pricing comparison is not available (requires two files)
  - [ ] **3.4.2** Ensure the component gracefully handles the single-file case

## Phase 4: Update User Journey and Messages
- [ ] **4.1** Update `messages.ts` with new journey states
  - [ ] **4.1.1** Add a new state for "single file report ready"
  - [ ] **4.1.2** Update existing messages to guide users through the new workflow
  - [ ] **4.1.3** Add messages encouraging users to upload a second file for comparison

## Phase 5: Testing and Refinement
- [ ] **5.1** Test the new workflow with various scenarios
  - [ ] **5.1.1** Test with a single file upload
  - [ ] **5.1.2** Test with two files uploaded sequentially
  - [ ] **5.1.3** Test the reset functionality
  - [ ] **5.1.4** Test with invalid files and error handling

## Questions and Considerations
1. Should we still maintain the "Get Reports" button when two files are uploaded, or should we automatically generate the comparison report?
2. How should we handle the transition between single-file report and two-file comparison report?
3. Should we add a visual indicator to show that more insights are available when a second file is uploaded?
4. Do we need to add any new metrics or visualizations specific to single-file analysis?

# AZ View UI Refactoring Plan

## Overview
Currently, the AZ View shows two upload zones side by side (Your Rates and Prospect's Rates). We need to simplify this to show only one upload zone initially, making the UI cleaner and more focused.

## Requirements
- Initially show only one upload zone on the left side of the container
- Add a vertical divider to the right of the first upload zone
- Remove "Your Rates" and "Prospect's Rates" labels
- Make the upload zone thinner (less height)
- Update journey messages to guide users through the new workflow
- After the first file is uploaded, show the second upload zone on the right side of the divider
- Show the code report directly below the left upload zone when a single file is uploaded (no tabs)
- Only show tabs (Files, Code Compare, Pricing Report) when two files are uploaded and comparison reports are generated
- Display the file name in a pill-style label with green success styling
- Style the "Code Report" text as a heading
- Use informational note styling for the second upload zone message
- Add proper error styling for duplicate file uploads
- Add a blue informational box at the top of the page when a single file is uploaded
- Use dark bento box style for the code report section
- Place "Code Report" heading and file name pill horizontally (Code Report on left, file name on right)
- Change "Code Report" tab to "Code Compare" when two files are uploaded
- Remove the duplicate information section (keep only the top box with the styling of the bottom box)
- Fix TypeScript errors in the AZContentHeader.vue file
- Maintain the same UI layout when the second file is uploaded (before generating reports)
- Show "Code Compare" tab when two files are uploaded (before generating reports)

## Questions
- [x] Should we keep the same width for the single upload zone (50% of container) or make it wider?
  - **Answer**: We'll keep it at 50% width (w-1/2) for each upload zone, with the first one on the left and the second one on the right.
- [x] After uploading the first file, should we show the second upload zone automatically or add a button to "Add another file"?
  - **Answer**: We'll show the second upload zone automatically after the first file is uploaded, with a message encouraging the user to upload a second file for comparison.
- [x] Should we keep the same styling for the upload zone or modify it?
  - **Answer**: We've modified the styling slightly by reducing the height from 160px to 120px and reducing the padding from p-8 to p-6 to make it more compact.
- [x] Do we need to update the "View Report" button styling or position?
  - **Answer**: We've removed the "View Report" button since the code report is now shown automatically below the upload zones when a single file is uploaded.
- [x] Should we add any new visual indicators to show the user can upload a second file after the first one?
  - **Answer**: Yes, we've added an informational note above the second upload zone saying "Upload a second file to compare and find opportunities" with blue styling similar to PreviewModal2.vue.
- [x] How should we display the single file report?
  - **Answer**: We'll show the code report directly below the left upload zone, taking up only the same width as the input zone. It will display a "Code Report" heading and the file name in a pill-style label with green success styling, placed horizontally with the "Code Report" heading on the left and the file name pill on the right. The report will use a dark bento box style with a bg-gray-900 container.
- [x] How should we handle error messages for duplicate file uploads?
  - **Answer**: We'll display error messages with red styling in a dedicated error box below the upload zone, matching the styling from PreviewModal2.vue.
- [x] Should we show the "Code Report" tab when only one file is uploaded?
  - **Answer**: No, we'll only show the "Files" tab when one file is uploaded. The code report will be displayed directly below the upload zone without requiring tab navigation.
- [x] What should we call the tab when two files are uploaded?
  - **Answer**: We'll change the name from "Code Report" to "Code Compare" when two files are uploaded to better reflect its purpose.
- [x] What should the UI look like after uploading the second file but before generating reports?
  - **Answer**: We should maintain the same UI layout as with one file, showing both upload zones and the single file report. The "Code Compare" tab should appear next to the "Files" tab, and the "Get Reports" button should be visible.

## Phase 1: Update Messages
- [x] **1.1** Update `messages.ts` with new journey messages
  - [x] **1.1.1** Update initial message to "Let's analyze some AZ decks, shall we?"
  - [x] **1.1.2** Update other journey messages to reflect the new workflow
  - [x] **1.1.3** Update ONE_FILE message to mention the code report is shown below

## Phase 2: Update AZFileUploads.vue
- [x] **2.1** Modify the upload zones layout
  - [x] **2.1.1** Create a horizontal layout with the first upload zone on the left
  - [x] **2.1.2** Add a vertical divider between the upload zones
  - [x] **2.1.3** Create a placeholder for the second upload zone on the right
  - [x] **2.1.4** Reduce upload zone height to 120px
  - [x] **2.1.5** Remove "Your Rates" and "Prospect's Rates" labels

- [x] **2.2** Implement conditional rendering for the second upload zone
  - [x] **2.2.1** Show second upload zone only after first file is uploaded
  - [x] **2.2.2** Add appropriate messaging for the second upload zone with informational note styling
  - [x] **2.2.3** Add placeholder message when no file is uploaded yet
  - [x] **2.2.4** Add proper error styling for duplicate file uploads

- [x] **2.3** Add single file report display
  - [x] **2.3.1** Create a section below the left upload zone to display the code report for a single file
  - [x] **2.3.2** Show basic stats (Total Codes, Total Destinations, Unique Destinations Percentage) in a vertical layout
  - [x] **2.3.3** Remove the "View Report" button since the report is shown automatically
  - [x] **2.3.4** Remove the tab display for the single file report
  - [x] **2.3.5** Ensure the report only takes up the same width as the left upload zone
  - [x] **2.3.6** Add a "Code Report" heading with proper styling
  - [x] **2.3.7** Use dark bento box style for the code report section
  - [x] **2.3.8** Display the file name in a pill-style label with green success styling
  - [x] **2.3.9** Place "Code Report" heading and file name pill horizontally (Code Report on left, file name on right)
  - [x] **2.3.10** Maintain the same UI layout when the second file is uploaded (before generating reports)

- [x] **2.4** Add blue informational box at the top
  - [x] **2.4.1** Add a "Single File Analysis" heading at the top
  - [x] **2.4.2** Add a blue informational box below the heading with appropriate styling

## Phase 3: Update AZContentHeader.vue
- [x] **3.1** Ensure the header content reflects the new workflow
  - [x] **3.1.1** Review and confirm no references to the dual upload zones need updating
  - [x] **3.1.2** Change "Code Report" tab to "Code Compare" when two files are uploaded
  - [x] **3.1.3** Remove the "Code Report" tab when only one file is uploaded
  - [x] **3.1.4** Fix TypeScript errors by replacing incorrect property names
  - [x] **3.1.5** Show "Code Compare" tab when two files are uploaded (before generating reports)
  - **Note**: After reviewing the AZContentHeader.vue component, we updated it to only show the "Files" tab when one file is uploaded and to rename the "Code Report" tab to "Code Compare" when two files are uploaded. We also fixed TypeScript errors by replacing 'shouldShowCodeReport' with a computed property 'showReportTabs' and 'singleFileReportReady' with 'hasSingleFileReport'. Additionally, we updated the availableReportTypes computed property to show the "Files" and "Code" tabs when two files are uploaded but before reports are generated.

## Phase 4: Testing and Refinement
- [ ] **4.1** Test the new workflow with various scenarios
  - [ ] **4.1.1** Test with a single file upload
  - [ ] **4.1.2** Test with two files uploaded sequentially
  - [ ] **4.1.3** Test the reset functionality
  - [ ] **4.1.4** Test with invalid files and error handling
  - [ ] **4.1.5** Test duplicate file upload error handling

## Summary of Changes

### Initial State
The UI now shows a single upload zone on the left side of the container (50% width) with a reduced height (120px). A vertical divider is shown in the middle, and the right side displays a placeholder message "Upload a file on the left side first". The upload zone has a dashed border and displays the message "DRAG & DROP to upload or CLICK to select file" with an upload icon. The journey message at the top says "Let's analyze some AZ decks, shall we? Upload a rate deck to get started."

### After First File Upload
After uploading the first file, the UI shows:
1. A "Single File Analysis" heading at the top with a dark informational box below it containing the message "Your file has been analyzed! View the code report to see details about your rate deck. Upload a second file to get a full comparison and find buying/selling opportunities."
2. The first upload zone on the left with the uploaded file name
3. A "Remove" button below the first upload zone
4. A second upload zone on the right side of the divider
5. An informational note above the second upload zone saying "Upload a second file to compare and find opportunities" with blue styling
6. A code report section below the left upload zone showing:
   - A horizontal layout with "Code Report" heading on the left and the file name pill on the right
   - A dark bento box (bg-gray-900) containing the stats
   - Basic stats (Total Codes, Total Destinations, Unique Destinations Percentage) in a vertical layout with each stat in its own card
7. Only the "Files" tab is shown in the navigation (removed the "Code Report" tab)

### After Second File Upload (Before Generating Reports)
After uploading the second file but before generating reports, the UI shows:
1. Both upload zones with their respective file names
2. "Remove" buttons below each upload zone
3. The code report section below the left upload zone (same as with one file)
4. The "Get Reports" button at the bottom right
5. The "Files" and "Code Compare" tabs in the navigation
6. The journey message changes to "Both files are uploaded. Click 'Get Reports' to see a detailed comparison and find opportunities."

### Error State for Duplicate Files
When attempting to upload a duplicate file, the UI shows:
1. An error message with red styling in a dedicated error box below the upload zone
2. The message includes the file name and "Please try again" text

### After Generating Reports
After clicking "Get Reports", the UI switches to the tabbed view and shows:
1. The report tabs (Files, Code Compare, Pricing Report) - note the change from "Code Report" to "Code Compare"
2. The selected report content
3. The journey message changes to "Analysis complete. Use the report tabs to explore your opportunities."

This new UI flow provides a cleaner, more focused experience that guides the user through the process of uploading files and generating reports, with a clear horizontal layout that visually separates the two upload zones and automatically displays the code report for a single file upload directly under the left upload zone. The design now matches the screenshots with the dark informational box at the top, dark bento box style for the code report, and horizontal layout for the Code Report heading and file name pill. The UI maintains consistency when the second file is uploaded, showing both upload zones and the single file report, with the "Code Compare" tab appearing next to the "Files" tab.

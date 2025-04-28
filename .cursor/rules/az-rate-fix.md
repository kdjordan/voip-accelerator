# AZ Rate Sheet Table - Discrepancy UI/UX Refactor

**Goal:** Refactor the UI within an expanded row in `AZRateSheetTable.vue` for destinations that have rate discrepancies (`group.hasDiscrepancy === true`). The objective is to create a unified and flexible workflow that allows users to not only select one of the existing conflicting rates but also to adjust that selected rate or set a completely new rate directly, using the same input controls developed for single-rate destinations.

**Current Behavior:**

- **Single-Rate:** Shows adjustment controls (Markup/Markdown %, $, Direct Set).
- **Multi-Rate (Discrepancy):** Shows only a list of conflicting rates with radio buttons to select one.

**Desired Behavior (for Multi-Rate Destinations):**

1.  **Rate Selection:** Display the list of conflicting rates with radio buttons. Allow the user to select one as the "base" rate. Visual indication for the selected rate. Code expander remains.
2.  **Unified Adjustment/Set Section:** _Below_ the rate list, display the _same_ controls used for single-rate destinations:
    - Adjustment Type (Markup/Markdown)
    - Value Type (Percentage/Fixed Amount)
    - Adjustment Value Input
    - "OR" Separator
    - Direct Rate Input
3.  **Interaction:**
    - The Adjustment controls operate _on the currently selected base rate_. They should be disabled if no base rate is selected via radio button.
    - Entering a value in the "Direct Rate Input" takes precedence over any selection or adjustment. It should clear the "Adjustment Value" input.
    - Entering a value in the "Adjustment Value" input should clear the "Direct Rate Input".
    - Selecting a different base rate via radio button should clear both the "Adjustment Value" and "Direct Rate Input".
4.  **Saving:**
    - A single "Save Changes" button triggers the save.
    - The final rate is determined by priority: Direct Rate Input > Calculated Adjustment (on selected base) > Selected Base Rate.
    - Save only if the final rate differs from the _original_ rate displayed when the row was first expanded.

## Implementation Summary

The refactor has been successfully implemented, with the following key changes:

1. **Unified Rate Management UI**

   - Restructured the expanded row UI to show rate selection followed by adjustment controls
   - Created a consistent user experience across both single and multi-rate destinations
   - Implemented proper disabling of adjustment controls when no rate is selected

2. **Enhanced State Management**

   - Modified `handleToggleExpandRow` to initialize adjustment state for both single and multi-rate destinations
   - Updated `selectRate` to clear adjustment values when a new rate is selected
   - Enhanced `hasUnsavedChanges` to properly detect all possible change scenarios
   - Implemented priority-based rate calculation in `saveRateSelection`

3. **Visual and Interactive Improvements**
   - Added conditional text for labels ("Selected Rate" vs "Current Rate")
   - Applied proper disabled states with visual indicators when controls are unavailable
   - Maintained the code expander functionality for multi-rate destinations

## Observations & Architecture

The implementation highlighted several aspects of the component's architecture:

1. **State Management**:

   - The component maintains multiple state objects (`selectedRates`, `singleRateAdjustments`, `directSetRates`, `originalRates`) that track different aspects of the rate management process
   - Most state is managed using Vue refs rather than Pinia store state, keeping interaction state local to the component

2. **Change Detection**:

   - The component implements detailed change detection through the `hasUnsavedChanges` function
   - Changes are determined through comparison against `originalRates`, allowing for accurate detection of modifications

3. **UI Organization**:
   - The expanded row UI is divided into logical sections: rate selection (for multi-rate) and adjustment controls (for all)
   - The component uses conditional rendering and classes based on state, following a declarative approach

## Lessons Learned

1. **Unified Logic Streamlines UX**: Combining the single and multi-rate UIs with shared adjustment controls creates a more consistent, learnable interface for users.

2. **Clear State Management**: The original separation of logic made it harder to maintain state consistency; the unified approach ensures all state changes are handled in one place.

3. **Priority-Based Decision Logic**: Implementing a clear hierarchy for determining the final rate (direct input > calculated adjustment > selected rate) simplifies the decision-making process.

4. **Responsive Feedback**: Disabling controls when they're not applicable provides immediate visual feedback to users about the available actions.

This implementation successfully addresses the need for a more flexible and intuitive workflow for managing rate discrepancies while maintaining compatibility with the existing codebase.

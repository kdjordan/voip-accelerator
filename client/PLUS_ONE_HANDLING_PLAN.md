# +1 Destination Handling Implementation Plan

## Problem Statement
Some international rate decks include North American (+1) destinations alongside true international destinations. Our current system assumes clean separation between US domestic and international rate decks.

## Discovery
- International providers sometimes sell US/Canada termination on their A-Z rate decks
- This means rate files can contain BOTH US NPAs AND international destinations
- Our current upload flow assumes files are either "US" or "International" but not both

## Solution Strategy
Add a pre-filtering step BEFORE column mapping that:
1. Detects +1 destinations in uploaded files
2. Asks user how to handle them
3. Filters the data accordingly
4. Proceeds with existing column mapping flow

## Implementation Plan

### Phase 1: Detection Logic (Safe - No UI Changes)
- [ ] Create `detectPlusOneDestinations()` utility function
- [ ] Add +1 detection to existing file analysis
- [ ] Test detection with sample files
- [ ] NO UI changes yet - just console logging

### Phase 2: Modal Component (Isolated)
- [ ] Create `PlusOneHandlingModal.vue` component
- [ ] Build it in isolation with mock data
- [ ] Test all user choice scenarios
- [ ] NO integration yet - just component testing

### Phase 3: Integration (Safe Branch)
- [ ] Create feature branch: `feature/plus-one-handling`
- [ ] Integrate modal into existing upload flow
- [ ] Add filtering logic based on user choices
- [ ] Test with real rate deck files
- [ ] Ensure backwards compatibility (files without +1 work normally)

### Phase 4: Validation & Merge
- [ ] Test with multiple file formats
- [ ] Verify existing functionality still works
- [ ] Get user feedback on modal UX
- [ ] Merge to main when confident

## Risk Mitigation
- Work in feature branch
- Keep existing code paths intact
- Add functionality, don't modify existing
- Test backwards compatibility thoroughly

## Success Criteria
- Files with only international destinations: no modal, works as before
- Files with only US destinations: no modal, works as before  
- Files with mixed +1 destinations: modal appears, user chooses, filtering works
- All existing functionality preserved

## Files to Modify
- `src/components/shared/PlusOneHandlingModal.vue` (NEW)
- `src/utils/plus-one-detector.ts` (NEW)
- `src/components/us/USFileUploads.vue` (minimal changes)
- `src/components/az/AZFileUploads.vue` (minimal changes)

## Testing Strategy
1. Test with pure US rate decks (should skip modal)
2. Test with pure international rate decks (should skip modal)
3. Test with mixed rate decks (should show modal)
4. Test user choice filtering works correctly
5. Test column mapping works after filtering

## Rollback Plan
If anything breaks:
- Feature branch keeps main branch safe
- Can revert individual commits
- Existing functionality remains untouched
- Users can still upload "clean" files normally
# Metro Area Filter Implementation Plan (Phased)

## Phase 1: Implement Metro Filter in USRateSheetTable.vue

### 1. Analyze and Prepare Data

- Review `metro-population.ts` for structure and export a list of metro area keys and display names for dropdowns.
- Ensure a type for MetroArea exists (or create one in `types/domains/metro-types.ts`).

### 2. Add Metro Filter UI

- In `USRateSheetTable.vue`, add a new dropdown (Listbox) for Metro Area, above or alongside the State filter.
- Populate options from `metro-population.ts`.
- Include an option for "All Metro Areas" (default, no filter).

### 3. Metro Filter State Management

- Add a new `selectedMetro` ref in the component.
- Watch for changes to `selectedMetro` and trigger data reloads (like state/NPANXX filters).

### 4. Metro Filter Logic in Data Fetching

- When a metro is selected:
  - Get the list of NPAs for that metro.
  - Filter the data so that only entries whose NPA (first 3 digits of NPANXX) is in that list are shown.
  - Combine with other filters: If state or NPANXX is also set, apply all filters together (intersection).
- Use Dexie/IndexedDB `.filter()` or `.where()` for efficient filtering if possible; otherwise, filter in-memory after fetching.

### 5. UI/UX Details

- Show the active filter in the UI (e.g., "Filtering by: New York Metro").
- Decide whether to disable state filter when metro is selected, or allow both (intersection logic).
- Reset pagination and scroll position on filter change.

### 6. Testing and Edge Cases

- Test combinations: Metro + State, Metro + NPANXX, etc.
- Show a clear message if no records match.
- Ensure filtering is efficient for large datasets.

### 7. Code Organization

- Extract metro filter logic into a composable or helper if reused.
- Keep types and constants in their own files.

### 8. Documentation

- Add comments explaining the filter logic.
- Update README or in-app help if needed.

### 9. (Optional) Advanced

- Show metro population in dropdown for context.
- Allow multi-select for metros (future enhancement).

---

## Phase 2: Extend to USDetailedComparisonTable.vue

- After completing and validating the implementation in `USRateSheetTable.vue`, apply the same pattern to `USDetailedComparisonTable.vue`.
- Reuse any composables, helpers, or types created in Phase 1.
- Adjust for any differences in data structure or filtering logic as needed.
- Test thoroughly, especially for performance and filter combinations.

---

## Open Questions for the User

1. **Should the metro filter be exclusive, or can it be combined with state/NPANXX filters (intersection)?**
2. **Should the dropdown show the population for each metro area?**
3. **Should the filter match on NPA only (first 3 digits), or also NXX (full NPANXX)?**
4. **Should we allow multi-select for metros, or just single-select for now?**
5. **Any specific UI/UX preferences for how the filter is presented or interacts with other filters?**

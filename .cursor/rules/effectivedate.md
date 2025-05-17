# Plan to Resolve DECREASE Effective Date Issue in `effective-date-updater.worker.ts`

**Problem Statement:** When applying effective date changes, records with `changeCode: DECREASE` are not having their `effectiveDate` field updated, even though the `DECREASE` `changeCode` itself is preserved. Console logs indicate that `originalChangeCodeForDest` is `undefined` in `STEP 2` for these destinations, leading to `effectiveDateMap.get(destinationName)` also being `undefined`. This prevents the `newEffectiveDate` from being correctly determined and applied. `INCREASE` and `SAME` change types work as expected.

**Hypothesis:** The `destinationName` key used to populate `changeCodeMap` and `effectiveDateMap` in `STEP 1` for `DECREASE` items is subtly different from the `destinationName` key used to query these maps in `STEP 2`.

**Debugging & Resolution Steps:**

1.  **Verify `destinationName` Keys in STEP 1 (Map Population):**

    - **Action:** Add detailed logging within the loop in `STEP 1` where `changeCodeMap` and `effectiveDateMap` are populated.
    - **Logging Content:** For each entry, log `group.destinationName`, `group.changeCode`, and the derived `effectiveDate` before it's set in `effectiveDateMap`.
    - **Focus:** Pay close attention to the exact `destinationName` string for `DECREASE` items. Note any leading/trailing whitespace, case differences, or special characters.

    ```typescript
    // Example logging for STEP 1
    // Inside: for (const group of chunk) { ... in processEffectiveDateChunk }

    // ... before effectiveDateMap.set(...) and changeCodeMap.set(...)
    console.log(
      `[Worker STEP 1 - POPULATE] Destination: "${group.destinationName}", ChangeCode: ${group.changeCode}, CalculatedDateForMap: ${effectiveDate}`
    );
    effectiveDateMap.set(group.destinationName, effectiveDate);
    changeCodeMap.set(group.destinationName, group.changeCode);
    processedDestinations.add(group.destinationName);
    ```

2.  **Verify `destinationName` Keys in STEP 2 (Map Query):**

    - **Action:** Enhance existing logging in `STEP 2` where `changeCodeMap` and `effectiveDateMap` are queried.
    - **Logging Content:** For the problematic destination (e.g., "Afghanistan- Fixed - Other"), log the `destinationName` being used in the loop _before_ querying the maps.
    - **Focus:** Compare this `destinationName` string meticulously with the one logged in STEP 1 for the same logical destination.

    ```typescript
    // Example enhanced logging for STEP 2
    // Inside: for (const destinationName of destinationBatch) { ... in processEffectiveDateChunk }

    if (destinationName === "Afghanistan- Fixed - Other") {
      // Or a dynamic problem_destination_name
      console.log(
        `[Worker STEP 2 - QUERY] Attempting to query maps for Destination: "${destinationName}"`
      );
    }
    const newEffectiveDate = effectiveDateMap.get(destinationName);
    const originalChangeCodeForDest = changeCodeMap.get(destinationName);

    if (destinationName === "Afghanistan- Fixed - Other") {
      // Or a dynamic problem_destination_name
      console.log(
        `[Worker STEP 2 - QUERY RESULT] For "${destinationName}": newEffectiveDate from map: ${newEffectiveDate}, originalChangeCodeForDest from map: ${originalChangeCodeForDest}`
      );
    }
    ```

3.  **Identify the Source of Discrepancy:**

    - **Action:** Analyze the logs from STEP 1 and STEP 2.
    - **If a mismatch is confirmed:**
      - Trace back where `group.destinationName` (for STEP 1) and `destinationName` (for STEP 2, which comes from `recordsByDestination.keys()`) originate.
      - `recordsByDestination` is populated from `input.allEntries`. Check if `input.allEntries` itself has inconsistent `destinationName` for items that should be grouped.
      - Look for any string manipulations, trimming, or case changes that might occur for `destinationName` in one path but not the other, specifically affecting `DECREASE` items or their grouping.
    - **If no obvious string mismatch:** Consider if the `DECREASE` items are being unexpectedly filtered out _before_ `changeCodeMap` and `effectiveDateMap` are populated, or if their `destinationName` is being modified in a way that prevents them from being correctly grouped with other records of the same destination during the `recordsByDestination` creation.

4.  **Implement the Fix:**

    - **Based on findings:**
      - **If string mismatch:** Standardize the `destinationName` key. This might involve applying `.trim()` or `.toLowerCase()` (if case-insensitivity is intended and safe) consistently when populating and querying the maps, or by ensuring the `destinationName` is taken from a single, reliable source for all related operations.
      - **If filtering/grouping issue:** Adjust the logic that prepares `input.allEntries` or populates `recordsByDestination` to ensure `DECREASE` items are correctly included and grouped.

5.  **Correct the Logic for Applying `newEffectiveDate`:**

    - **Problem Reiteration:** The current log shows `Calculated newEffectiveDate for group: undefined`. This is because `originalChangeCodeForDest` is `undefined`, which then causes `calculateEffectiveDate` not to be called or to return an incorrect value, leading to `effectiveDateMap.get(destinationName)` returning `undefined`.
    - **Action:** Once `originalChangeCodeForDest` is correctly retrieved (by fixing the `destinationName` key issue), ensure that `newEffectiveDate` (which is `effectiveDateMap.get(destinationName)`) is correctly populated. The `calculateEffectiveDate` function itself seems to be working for `DECREASE` (as per initial logs), so the main issue is providing it with the correct `changeCode` and `settings` and storing its result correctly under the _consistent_ `destinationName` key.

    - The core loop in `STEP 2` that updates records should be:

      ```typescript
      // Inside for (const record of records) { ... }
      const newEffectiveDateForRecord = effectiveDateMap.get(destinationName); // Get from the map

      if (record.destinationName === "Afghanistan- Fixed - Other") {
        // Or a dynamic problem_destination_name
        console.log(
          `[Worker STEP 2 - APPLY] Record ID: ${record.id}, Current EffDate: ${record.effectiveDate}, ChangeCode: ${record.changeCode}, New EffDate from map: ${newEffectiveDateForRecord}`
        );
      }

      if (
        newEffectiveDateForRecord &&
        record.changeCode === originalChangeCodeForDest
      ) {
        // Ensure we apply date for the intended change
        if (record.effectiveDate !== newEffectiveDateForRecord) {
          record.effectiveDate = newEffectiveDateForRecord;
          updatedCount++;
          // ... (postMessage for individual update)
        }
      }
      ```

6.  **Test Thoroughly:**

    - Test the `DECREASE` scenario with the specific "Afghanistan- Fixed - Other" case.
    - Test with other `DECREASE` items.
    - Re-test `INCREASE` and `SAME` scenarios to ensure no regressions.
    - Test edge cases: multiple destinations, mixed change codes within a batch.

7.  **Cleanup:**
    - Remove all temporary `console.log` statements added for debugging once the issue is confirmed resolved.

By following these steps, we should be able to isolate why `destinationName` keys are not matching for `DECREASE` items and implement a robust fix.

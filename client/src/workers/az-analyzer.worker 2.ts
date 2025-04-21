import type {
  AZStandardizedData,
  IntCountryInfo,
  AZEnhancedCodeReport,
  AZFileInfo,
  AZCodeStats,
  AZDestinationStats,
  AZCountryBreakdown,
  AZBreakoutDetail,
} from '@/types/domains/az-types';

// Define the input structure for the worker
interface AZAnalyzerInput {
  fileName: string;
  fileData: AZStandardizedData[];
  intCountryData: Record<string, IntCountryInfo>;
}

self.addEventListener('message', (event) => {
  try {
    if (!event.data) {
      console.error('[AZ Worker] No data received');
      self.postMessage({ error: 'No data received in AZ worker' });
      return;
    }

    const { fileName, fileData, intCountryData } = event.data as AZAnalyzerInput;

    if (!fileName || !fileData || !intCountryData) {
      console.error('[AZ Worker] Missing required input data', {
        fileName,
        fileData,
        intCountryData,
      });
      self.postMessage({ error: 'Missing required input data in AZ worker' });
      return;
    }

    // console.log(`[AZ Worker] Received data for file: ${fileName}`, {
    //   fileDataCount: fileData.length,
    //   intCountryDataCount: Object.keys(intCountryData).length,
    // });

    const report = generateReport(fileName, fileData, intCountryData);

    // console.log(`[AZ Worker] Generated report for file: ${fileName}`, report);
    self.postMessage(report);
  } catch (error) {
    console.error('[AZ Worker] Error processing message:', error);
    self.postMessage({
      error: error instanceof Error ? error.message : 'Unknown error in AZ worker',
    });
  }
});

function generateReport(
  fileName: string,
  fileData: AZStandardizedData[],
  intCountryData: Record<string, IntCountryInfo>
): AZEnhancedCodeReport {
  // --- Pre-computation: Build Lookup Maps ---
  const isoToCountryMap = new Map<string, IntCountryInfo>();
  const dialCodeToIsoMap = new Map<string, string[]>();

  Object.values(intCountryData).forEach((country) => {
    if (country && country.isoCode) {
      // Store country info by ISO code
      isoToCountryMap.set(country.isoCode, country);

      // Map each dial code back to this country's ISO code
      country.dialCodes.forEach((code) => {
        const existingIsos = dialCodeToIsoMap.get(code) || [];
        if (!existingIsos.includes(country.isoCode)) {
          existingIsos.push(country.isoCode);
          dialCodeToIsoMap.set(code, existingIsos);
        }
      });
    } else {
      // console.warn('[AZ Worker] Skipping country with missing data:', country);
    }
  });

  // Helper function to find the longest matching prefix
  function findMatchingIsoCodes(fileDialCode: string): string[] {
    let longestMatchPrefix = '';
    // Iterate through known system dial code prefixes
    for (const systemPrefix of dialCodeToIsoMap.keys()) {
      if (fileDialCode.startsWith(systemPrefix)) {
        // If it's a prefix match, check if it's longer than the current longest match
        if (systemPrefix.length > longestMatchPrefix.length) {
          longestMatchPrefix = systemPrefix;
        }
      }
    }

    // Return the ISO codes associated with the longest found prefix, or empty array if no match
    return longestMatchPrefix ? dialCodeToIsoMap.get(longestMatchPrefix) || [] : [];
  }

  // 1. File Info
  const fileInfo: AZFileInfo = {
    fileName,
    totalCodes: fileData.length,
  };

  // 2. Code Stats
  const systemDialCodes = new Set<string>();
  isoToCountryMap.forEach((country) => {
    country.dialCodes.forEach((code) => systemDialCodes.add(code));
  });
  const systemCodeCount = systemDialCodes.size;

  const fileDialCodesSet = new Set<string>(fileData.map((entry) => entry.dialCode));
  const fileCodeCount = fileDialCodesSet.size;

  const codeStats: AZCodeStats = {
    systemCodeCount,
    fileCodeCount,
  };

  // 3. Destination Stats
  const uniqueDestNames = new Set<string>(fileData.map((entry) => entry.destName));
  const totalDestinations = uniqueDestNames.size;

  const destinationStats: AZDestinationStats = {
    totalDestinations,
    // Using totalCodes as the denominator per interface definition
    uniqueDestinationPercent:
      fileInfo.totalCodes > 0 ? (totalDestinations / fileInfo.totalCodes) * 100 : 0,
  };

  // --- 4. Countries Breakdown (Refactored Logic) ---
  const countryDataAccumulator = new Map<string, Map<string, Set<string>>>(); // isoCode -> breakoutName -> Set<dialCode>

  // Accumulate data from the file using longest prefix matching
  fileData.forEach((entry) => {
    // Find ISO code(s) based on the longest matching prefix
    const isoCodes = findMatchingIsoCodes(entry.dialCode);

    if (isoCodes.length > 0) {
      isoCodes.forEach((isoCode) => {
        if (!countryDataAccumulator.has(isoCode)) {
          countryDataAccumulator.set(isoCode, new Map<string, Set<string>>());
        }
        const breakoutMap = countryDataAccumulator.get(isoCode)!;

        const breakoutName = entry.destName;
        if (!breakoutMap.has(breakoutName)) {
          breakoutMap.set(breakoutName, new Set<string>());
        }
        const dialCodeSet = breakoutMap.get(breakoutName)!;
        dialCodeSet.add(entry.dialCode);
      });
    } else {
      // console.log(`[AZ Worker] No matching country prefix found for dial code: ${entry.dialCode}`);
      // Optionally handle codes that don't match any known country prefix
    }
  });

  // Build the final AZCountryBreakdown array
  const countries: AZCountryBreakdown[] = [];
  countryDataAccumulator.forEach((breakoutMap, isoCode) => {
    const countryInfo = isoToCountryMap.get(isoCode);
    if (countryInfo) {
      const breakouts: AZBreakoutDetail[] = [];
      breakoutMap.forEach((dialCodeSet, breakoutName) => {
        breakouts.push({
          breakoutName,
          dialCodes: Array.from(dialCodeSet).sort(), // Sort dial codes for consistency
        });
      });

      // Sort breakouts alphabetically by name
      breakouts.sort((a, b) => a.breakoutName.localeCompare(b.breakoutName));

      countries.push({
        countryName: countryInfo.countryName,
        isoCode: countryInfo.isoCode,
        totalSystemDialCodes: countryInfo.dialCodes.length, // Total dial codes known for this country
        uniqueBreakoutCount: breakoutMap.size, // Count of unique destination names found
        breakouts, // The detailed breakout list
      });
    }
    // else: isoCode from accumulator not found in isoToCountryMap (shouldn't happen)
  });

  // Sort countries alphabetically by name
  countries.sort((a, b) => a.countryName.localeCompare(b.countryName));

  // 5. Construct Final Report
  const report: AZEnhancedCodeReport = {
    fileInfo,
    codeStats,
    destinationStats,
    countries,
  };

  return report;
}

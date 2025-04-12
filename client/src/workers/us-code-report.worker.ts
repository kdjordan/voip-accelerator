import type {
  USEnhancedCodeReport,
  USEnhancedFileReport,
  USEnhancedCodeReportInput,
  USStandardizedData,
  USCountryBreakdown,
  USStateBreakdown,
  USRateStats,
} from '@/types/domains/us-types';
import { COUNTRY_CODES } from '@/types/constants/country-codes';
import { STATE_CODES } from '@/types/constants/state-codes';
import { PROVINCE_CODES } from '@/types/constants/province-codes';

self.addEventListener('message', (event) => {
  try {
    console.log('[Worker] Received message event:', event);

    if (!event.data) {
      console.error('[Worker] No data received in worker');
      self.postMessage({ error: 'No data received in worker' });
      return;
    }

    // Destructure the data from the event
    const { fileName, fileData, lergData } = event.data;

    // Log the received data for debugging
    console.log(`[Worker] Received fileName: ${fileName}`);
    console.log(
      `[Worker] Received fileData: ${
        Array.isArray(fileData) ? `${fileData.length} records` : typeof fileData
      }`
    );
    // Log LERG data structure details
    if (lergData) {
      console.log('[Worker] Received lergData:');
      console.log(
        `  - validNpas: ${Array.isArray(lergData.validNpas) ? lergData.validNpas.length : 'N/A'}`
      );
      console.log(
        `  - npaMappings keys: ${
          lergData.npaMappings ? Object.keys(lergData.npaMappings).length : 'N/A'
        }`
      );
      console.log(
        `  - countryGroups keys: ${
          lergData.countryGroups ? Object.keys(lergData.countryGroups).length : 'N/A'
        }`
      );
      console.log(
        `  - countryData length: ${
          Array.isArray(lergData.countryData) ? lergData.countryData.length : 'N/A'
        }`
      );
      console.log(
        `  - stateNPAs keys: ${lergData.stateNPAs ? Object.keys(lergData.stateNPAs).length : 'N/A'}`
      );
    } else {
      console.log('[Worker] Received lergData: null or undefined');
    }

    // Validate required inputs
    if (!fileName || !fileData) {
      console.error('[Worker] Missing required input: fileName or fileData');
      self.postMessage({ error: 'Missing required input: fileName or fileData' });
      return;
    }

    // Check if LERG data is present (necessary for full report)
    if (!lergData) {
      console.warn('[Worker] Missing LERG data - cannot generate full enhanced report.');
      // Post an error or a minimal report indicating missing LERG data
      // For now, just posting error, adjust if a specific minimal report is needed
      self.postMessage({ error: 'LERG data was not provided to the worker.' });
      return;
    }

    console.log(
      `[Worker] Processing file ${fileName} with ${fileData.length} records and LERG data.`
    );

    // Proceed with generating the full report
    try {
      const report = generateEnhancedCodeReport(event.data);
      console.log(`[Worker] Report generated successfully for ${fileName}.`);
      self.postMessage(report);
    } catch (error) {
      console.error(`[Worker] Error during generateEnhancedCodeReport for ${fileName}:`, error);
      // Send back a detailed error message
      self.postMessage({
        error: `Error generating report for ${fileName}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    }
  } catch (error) {
    // Catch any top-level errors in the message handler
    console.error('[Worker] Top-level error in worker message handler:', error);
    self.postMessage({ error: error instanceof Error ? error.message : 'Unknown error in worker' });
  }
});

function generateEnhancedCodeReport(input: USEnhancedCodeReportInput): USEnhancedCodeReport {
  console.error('[Worker] Starting generateEnhancedCodeReport');
  const { fileName, fileData, lergData } = input;

  if (!fileName || !fileData) {
    throw Error('Missing file name or fileData in worker!');
  }

  try {
    // Normalize file data to ensure consistent format
    const normalizedData = fileData.map((entry) => {
      // Make a copy of the entry to avoid mutating the original
      const normalized = { ...entry };

      // Handle 7-digit NPANXX with leading "1"
      if (
        normalized.npanxx &&
        normalized.npanxx.length === 7 &&
        normalized.npanxx.startsWith('1')
      ) {
        normalized.npanxx = normalized.npanxx.substring(1);
        // Recalculate NPA and NXX from normalized NPANXX
        normalized.npa = normalized.npanxx.substring(0, 3);
        normalized.nxx = normalized.npanxx.substring(3, 6);
      }

      return normalized;
    });

    console.error(`[Worker] Normalized ${normalizedData.length} records`);

    // Process the normalized data for a single file
    console.error('[Worker] Calling processFileData');
    const fileReport = processFileData(fileName, normalizedData, lergData);
    console.error(
      `[Worker] File report processed with ${fileReport.countries?.length || 0} countries`
    );

    // Make sure the filename is set correctly
    if (!fileReport.fileName) {
      fileReport.fileName = fileName;
    }

    // Return the report for one file
    return {
      file1: fileReport,
    };
  } catch (error) {
    console.error('[Worker] Error in generateEnhancedCodeReport:', error);
    throw error;
  }
}

function processFileData(
  fileName: string,
  fileData: USStandardizedData[],
  lergData?: USEnhancedCodeReportInput['lergData']
): USEnhancedFileReport {
  // Group data by NPA - process in chunks to avoid blocking
  const npaGroups = new Map<string, USStandardizedData[]>();
  const chunkSize = 5000;

  // Process in chunks
  for (let i = 0; i < fileData.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, fileData.length);
    const chunk = fileData.slice(i, end);

    // Group by NPA
    chunk.forEach((entry) => {
      if (!npaGroups.has(entry.npa)) {
        npaGroups.set(entry.npa, []);
      }
      npaGroups.get(entry.npa)?.push(entry);
    });

    // Using setTimeout with 0 delay inside a worker won't block the main thread
    // but will allow the worker's message queue to process other messages
    if (i + chunkSize < fileData.length) {
      console.log(
        `[Worker] Processed chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(
          fileData.length / chunkSize
        )}`
      );
    }
  }

  // Create country breakdown
  const countries: USCountryBreakdown[] = [];

  // Process US data first
  const usCountry = createCountryBreakdown('US', 'United States', npaGroups, lergData);
  if (usCountry) {
    countries.push(usCountry);
  }

  // Process other countries
  if (lergData && lergData.countryData) {
    lergData.countryData.forEach((country) => {
      if (country.country !== 'US') {
        const countryCode = country.country;
        const countryMapping = COUNTRY_CODES[countryCode];
        const countryName = countryMapping ? countryMapping.name : countryCode;

        const countryBreakdown = createCountryBreakdown(
          countryCode,
          countryName,
          npaGroups,
          lergData
        );
        if (countryBreakdown) {
          countries.push(countryBreakdown);
        }
      }
    });
  }

  return {
    fileName,
    totalCodes: fileData.length,
    countries,
  };
}

function createCountryBreakdown(
  countryCode: string,
  countryName: string,
  npaGroups: Map<string, USStandardizedData[]>,
  lergData?: USEnhancedCodeReportInput['lergData']
): USCountryBreakdown | null {
  if (!lergData) return null;

  // Get all NPAs for this country from LERG data
  const countryLergData = lergData.countryData.find((c) => c.country === countryCode);

  if (!countryLergData) return null;

  // Get NPAs in the file for this country
  const countryNPAs = new Set<string>();
  let totalNPAsInFile = 0;

  // States breakdown for US and Canada
  const stateBreakdowns: USStateBreakdown[] = [];

  if (countryCode === 'US' || countryCode === 'CA') {
    // Get state NPAs from LERG data
    Object.entries(lergData.stateNPAs)
      .filter(([stateCode]) => {
        // For US, only include valid US state codes
        if (countryCode === 'US') {
          return stateCode in STATE_CODES;
        }
        // For CA, only include valid Canadian province codes, exclude the California state code 'CA'
        if (countryCode === 'CA') {
          return stateCode in PROVINCE_CODES;
        }
        return false;
      })
      .forEach(([stateCode, stateNPAs]) => {
        const stateNPAsInFile = Array.from(npaGroups.keys()).filter((npa) =>
          stateNPAs.includes(npa)
        );

        if (stateNPAsInFile.length > 0) {
          // Calculate state coverage
          const stateCoverage = (stateNPAsInFile.length / stateNPAs.length) * 100;

          // Get rate stats for this state
          const stateEntries: USStandardizedData[] = [];
          stateNPAsInFile.forEach((npa) => {
            const npasEntries = npaGroups.get(npa) || [];
            stateEntries.push(...npasEntries);
            countryNPAs.add(npa);
          });

          totalNPAsInFile += stateNPAsInFile.length;

          // Calculate rate statistics
          const rateStats = calculateRateStats(stateEntries);

          // Add state breakdown
          stateBreakdowns.push({
            stateCode,
            stateName: getStateName(stateCode, countryCode),
            npas: stateNPAsInFile,
            coverage: stateCoverage,
            rateStats,
          });
        }
      });
  } else {
    // For other countries, just count NPAs
    countryLergData.npas.forEach((npa) => {
      if (npaGroups.has(npa)) {
        countryNPAs.add(npa);
        totalNPAsInFile++;
      }
    });
  }

  // Calculate country coverage
  const npaCoverage = (totalNPAsInFile / countryLergData.npaCount) * 100;

  return {
    countryCode,
    countryName,
    npaCoverage,
    totalNPAs: countryLergData.npaCount,
    npas: Array.from(countryNPAs),
    states: stateBreakdowns.length > 0 ? stateBreakdowns : undefined,
  };
}

function calculateRateStats(entries: USStandardizedData[]): {
  interstate: USRateStats;
  intrastate: USRateStats;
  indeterminate: USRateStats;
} {
  // For large datasets, we'll process them in chunks to avoid excessive memory usage
  const chunkSize = 10000;
  let interSum = 0;
  let interCount = 0;
  let intraSum = 0;
  let intraCount = 0;
  let indetermSum = 0;
  let indetermCount = 0;

  // Process in chunks
  for (let i = 0; i < entries.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, entries.length);
    const chunk = entries.slice(i, end);

    // Calculate interstate stats for this chunk
    chunk.forEach((entry, entryIndex) => {
      // --- DEBUGGING STEP 3 START ---
      // Log the rates of the first 5 entries in the first chunk
      if (i === 0 && entryIndex < 5) {
        console.log(
          `[DEBUG][Worker][Stats] Chunk 0, Entry ${entryIndex}: Rates -> inter: ${entry.interRate}, intra: ${entry.intraRate}, indeterm: ${entry.indetermRate}`
        );
      }
      // --- DEBUGGING STEP 3 END ---

      if (entry.interRate !== null && entry.interRate !== undefined) {
        interSum += entry.interRate;
        interCount++;
      }

      if (entry.intraRate !== null && entry.intraRate !== undefined) {
        intraSum += entry.intraRate;
        intraCount++;
      }

      if (entry.indetermRate !== null && entry.indetermRate !== undefined) {
        indetermSum += entry.indetermRate;
        indetermCount++;
      }

      // --- DEBUGGING STEP 3 START ---
      // Log accumulating sums/counts for the first 5 entries in the first chunk
      if (i === 0 && entryIndex < 5) {
        console.log(
          `[DEBUG][Worker][Stats] Chunk 0, Entry ${entryIndex}: Sums -> inter: ${interSum.toFixed(
            6
          )}, intra: ${intraSum.toFixed(6)}, indeterm: ${indetermSum.toFixed(6)}`
        );
        console.log(
          `[DEBUG][Worker][Stats] Chunk 0, Entry ${entryIndex}: Counts -> inter: ${interCount}, intra: ${intraCount}, indeterm: ${indetermCount}`
        );
      }
      // --- DEBUGGING STEP 3 END ---
    });
  }

  // --- DEBUGGING STEP 3 START ---
  console.log(
    `[DEBUG][Worker][Stats] Final Sums -> inter: ${interSum.toFixed(6)}, intra: ${intraSum.toFixed(
      6
    )}, indeterm: ${indetermSum.toFixed(6)}`
  );
  console.log(
    `[DEBUG][Worker][Stats] Final Counts -> inter: ${interCount}, intra: ${intraCount}, indeterm: ${indetermCount}`
  );
  // --- DEBUGGING STEP 3 END ---

  // Calculate averages
  const interAvg = interCount > 0 ? interSum / interCount : 0;
  const intraAvg = intraCount > 0 ? intraSum / intraCount : 0;
  const indetermAvg = indetermCount > 0 ? indetermSum / indetermCount : 0;

  // --- DEBUGGING STEP 3 START ---
  console.log(
    `[DEBUG][Worker][Stats] Calculated Averages -> inter: ${interAvg.toFixed(
      6
    )}, intra: ${intraAvg.toFixed(6)}, indeterm: ${indetermAvg.toFixed(6)}`
  );
  // --- DEBUGGING STEP 3 END ---

  return {
    interstate: {
      average: interAvg,
      count: interCount,
      coverage: entries.length > 0 ? (interCount / entries.length) * 100 : 0,
    },
    intrastate: {
      average: intraAvg,
      count: intraCount,
      coverage: entries.length > 0 ? (intraCount / entries.length) * 100 : 0,
    },
    indeterminate: {
      average: indetermAvg,
      count: indetermCount,
      coverage: entries.length > 0 ? (indetermCount / entries.length) * 100 : 0,
    },
  };
}

// Helper function to get the proper state or province name
function getStateName(code: string, country: string): string {
  if (country === 'US') {
    return STATE_CODES[code]?.name || code;
  }
  if (country === 'CA') {
    return PROVINCE_CODES[code]?.name || code;
  }
  return code;
}

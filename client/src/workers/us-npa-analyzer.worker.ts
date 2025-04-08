import type {
  USEnhancedCodeReport,
  USEnhancedFileReport,
  USCountryBreakdown,
  USStateBreakdown,
  USRateStats,
  USStandardizedData,
} from '@/types/domains/us-types';
import { COUNTRY_CODES } from '@/types/constants/country-codes';
import { STATE_CODES } from '@/types/constants/state-codes';
import { PROVINCE_CODES } from '@/types/constants/province-codes';

// Define the input structure
interface NPAAnalyzerInput {
  tableName: string;
  fileName: string;
  lergData: {
    stateNPAs: Record<string, string[]>;
    countryData: Array<{
      country: string;
      npaCount: number;
      npas: string[];
    }>;
  };
}

self.addEventListener('message', async (event) => {
  try {
    console.error('[Worker] Received message in NPA Analyzer worker');

    if (!event.data) {
      console.error('[Worker] No data received in worker');
      self.postMessage({ error: 'No data received in worker' });
      return;
    }

    const { tableName, fileName, lergData, fileData } = event.data as NPAAnalyzerInput & {
      fileData: USStandardizedData[];
    };

    if (!tableName || !fileName) {
      console.error('[Worker] Missing required input: tableName or fileName');
      self.postMessage({ error: 'Missing required input: tableName or fileName' });
      return;
    }

    if (!lergData) {
      console.error('[Worker] Missing LERG data');
      self.postMessage({ error: 'Missing LERG data' });
      return;
    }

    if (!fileData || !Array.isArray(fileData)) {
      console.error('[Worker] Missing or invalid fileData');
      self.postMessage({ error: 'Missing or invalid fileData' });
      return;
    }

    console.error(`[Worker] Analyzing NPAs for table ${tableName} with ${fileData.length} records`);

    try {
      // Process the data from the object store
      const report = generateReport(tableName, fileName, fileData, lergData);
      console.error(
        `[Worker] Report generated successfully with ${
          report.file1.countries?.length || 0
        } countries`
      );
      self.postMessage(report);
    } catch (error) {
      console.error('[Worker] Error generating report:', error);

      // Create a fallback report
      const fallbackReport: USEnhancedCodeReport = {
        file1: {
          fileName: fileName,
          totalCodes: fileData.length,
          countries: [
            {
              countryCode: 'US',
              countryName: 'United States',
              npaCoverage: 0,
              totalNPAs: 0,
              npas: [],
            },
          ],
        },
      };

      console.error('[Worker] Sending fallback report after error');
      self.postMessage(fallbackReport);
    }
  } catch (error) {
    console.error('[Worker] Top-level error in worker:', error);
    self.postMessage({ error: error instanceof Error ? error.message : 'Unknown error in worker' });
  }
});

function generateReport(
  tableName: string,
  fileName: string,
  fileData: USStandardizedData[],
  lergData: NPAAnalyzerInput['lergData']
): USEnhancedCodeReport {
  console.error('[Worker] Starting report generation');

  // Group data by NPA
  const npaGroups = new Map<string, USStandardizedData[]>();
  fileData.forEach((entry) => {
    if (!npaGroups.has(entry.npa)) {
      npaGroups.set(entry.npa, []);
    }
    npaGroups.get(entry.npa)?.push(entry);
  });

  console.error(`[Worker] Found ${npaGroups.size} unique NPAs in the data`);

  // Create country breakdown
  const countries: USCountryBreakdown[] = [];

  // Process US data first
  const usCountry = createCountryBreakdown('US', 'United States', npaGroups, lergData);
  if (usCountry) {
    countries.push(usCountry);
  }

  // Process Canada next
  const caCountry = createCountryBreakdown('CA', 'Canada', npaGroups, lergData);
  if (caCountry) {
    countries.push(caCountry);
  }

  // Process other countries
  if (lergData.countryData) {
    lergData.countryData.forEach((country) => {
      if (country.country !== 'US' && country.country !== 'CA') {
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

  // Calculate overall rate statistics
  const overallRateStats = calculateRateStats(fileData);

  // Create file report
  const fileReport: USEnhancedFileReport = {
    fileName,
    totalCodes: fileData.length,
    countries,
    rateStats: overallRateStats,
  };

  return {
    file1: fileReport,
  };
}

function createCountryBreakdown(
  countryCode: string,
  countryName: string,
  npaGroups: Map<string, USStandardizedData[]>,
  lergData: NPAAnalyzerInput['lergData']
): USCountryBreakdown | null {
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
        // For CA, only include valid Canadian province codes
        if (countryCode === 'CA') {
          return stateCode in PROVINCE_CODES;
        }
        return false;
      })
      .forEach(([stateCode, stateNPAs]) => {
        // Get US state or Canadian province name
        const stateName =
          countryCode === 'US'
            ? STATE_CODES[stateCode]?.name || stateCode
            : PROVINCE_CODES[stateCode]?.name || stateCode;

        // Find NPAs from this state that are in our file
        const npasInFile: string[] = [];
        let stateEntries: USStandardizedData[] = [];

        stateNPAs.forEach((npa) => {
          const entriesForNPA = npaGroups.get(npa);
          if (entriesForNPA && entriesForNPA.length > 0) {
            npasInFile.push(npa);
            stateEntries = stateEntries.concat(entriesForNPA);
            countryNPAs.add(npa);
            totalNPAsInFile++;
          }
        });

        // Only add states that have at least one NPA match
        if (npasInFile.length > 0) {
          const coverage = stateNPAs.length > 0 ? (npasInFile.length / stateNPAs.length) * 100 : 0;

          const rateStats = calculateRateStats(stateEntries);

          stateBreakdowns.push({
            stateCode,
            stateName,
            npas: npasInFile,
            coverage,
            rateStats,
          });
        }
      });
  } else {
    // For other countries, just track the NPAs without state breakdowns
    countryLergData.npas.forEach((npa) => {
      if (npaGroups.has(npa)) {
        countryNPAs.add(npa);
        totalNPAsInFile++;
      }
    });
  }

  // Only create country breakdowns for countries that have matching NPAs
  if (countryNPAs.size === 0) return null;

  // Calculate coverage percentage
  const npaCoverage =
    countryLergData.npaCount > 0 ? (totalNPAsInFile / countryLergData.npaCount) * 100 : 0;

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
  if (!entries || entries.length === 0) {
    return {
      interstate: { average: 0, count: 0, coverage: 0 },
      intrastate: { average: 0, count: 0, coverage: 0 },
      indeterminate: { average: 0, count: 0, coverage: 0 },
    };
  }

  const totalEntries = entries.length;

  // Interstate rates
  const interRates = entries.filter((e) => !isNaN(e.interRate));
  const interSum = interRates.reduce((sum, e) => sum + e.interRate, 0);
  const interAvg = interRates.length > 0 ? interSum / interRates.length : 0;
  const interCoverage = (interRates.length / totalEntries) * 100;

  // Intrastate rates
  const intraRates = entries.filter((e) => !isNaN(e.intraRate));
  const intraSum = intraRates.reduce((sum, e) => sum + e.intraRate, 0);
  const intraAvg = intraRates.length > 0 ? intraSum / intraRates.length : 0;
  const intraCoverage = (intraRates.length / totalEntries) * 100;

  // Indeterminate rates
  const indetermRates = entries.filter((e) => !isNaN(e.indetermRate));
  const indetermSum = indetermRates.reduce((sum, e) => sum + e.indetermRate, 0);
  const indetermAvg = indetermRates.length > 0 ? indetermSum / indetermRates.length : 0;
  const indetermCoverage = (indetermRates.length / totalEntries) * 100;

  return {
    interstate: {
      average: interAvg,
      count: interRates.length,
      coverage: interCoverage,
    },
    intrastate: {
      average: intraAvg,
      count: intraRates.length,
      coverage: intraCoverage,
    },
    indeterminate: {
      average: indetermAvg,
      count: indetermRates.length,
      coverage: indetermCoverage,
    },
  };
}

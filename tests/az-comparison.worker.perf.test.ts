import { describe, it, expect } from 'vitest'
import { generateReports } from '../src/workers/az/generate-reports'
import { AZReportsInput, AZStandardizedData } from '../types/app-types'
import Papa from 'papaparse'
import { readFileSync, existsSync, readdirSync } from 'fs'
import path from 'path'

describe('az-comparison performance', () => {
  it('should handle large datasets in a reasonable time', () => {
    const parseCSV = (filePath: string): AZStandardizedData[] => {
      const absolutePath = path.resolve(process.cwd(), filePath);
      console.log(`Attempting to read file: ${absolutePath}`);

      if (!existsSync(absolutePath)) {
        console.error(`File does not exist: ${absolutePath}`);
        console.log('Current directory contents:', readdirSync(path.dirname(absolutePath)));
        return [];
      }

      try {
        const fileContent = readFileSync(absolutePath, 'utf8');
        console.log(`File content (first 100 chars): ${fileContent.slice(0, 100)}`);

        const parseResult = Papa.parse(fileContent, { header: true });
        console.log(`Parse errors: ${JSON.stringify(parseResult.errors)}`);
        const rawData = parseResult.data as any[];
        console.log(`Parsed data length: ${rawData.length}`);
        console.log(`Sample parsed data: ${JSON.stringify(rawData[0])}`);

        // Log all unique keys in the parsed data
        const allKeys = new Set(rawData.flatMap(Object.keys));
        console.log('All unique keys in parsed data:', Array.from(allKeys));

        const filteredData = rawData.filter(entry =>
          entry &&
          Object.keys(entry).length > 0 && // Ensure the entry is not empty
          entry['93'] && // Assuming '93' is the dialCode column
          entry['Afghanistan, Fixed - Other'] && // Assuming this is the destName column
          (entry['0.18'] || entry['0.19']) // Assuming these are possible rate columns
        );
        console.log(`Filtered data length: ${filteredData.length}`);

        if (filteredData.length === 0) {
          console.log('Sample raw data:', rawData.slice(0, 5));
        }

        return filteredData.map(entry => ({
          dialCode: parseInt(entry['93'], 10),
          destName: entry['Afghanistan, Fixed - Other'],
          rate: parseFloat(entry['0.18'] || entry['0.19'] || '0')
        }));
      } catch (error) {
        console.error(`Error reading or parsing file ${absolutePath}:`, error);
        return [];
      }
    };

    const file1Data = parseCSV('src/data/impact.csv');
    const file2Data = parseCSV('src/data/impact-new.csv');

    console.log(`Processed file1Data length: ${file1Data.length}`);
    console.log(`Processed file2Data length: ${file2Data.length}`);

    if (file1Data.length === 0 || file2Data.length === 0) {
      console.error('One or both CSV files are empty after parsing.');
      console.log('File 1 sample:', file1Data.slice(0, 5));
      console.log('File 2 sample:', file2Data.slice(0, 5));
    }

    const input: AZReportsInput = {
      fileName1: 'impact.csv',
      fileName2: 'impact-new.csv',
      file1Data,
      file2Data,
    }

    const start = Date.now()
    const { pricingReport, codeReport } = generateReports(input)
    const end = Date.now()

    console.log(`Time taken: ${end - start}ms`)
    console.log('Pricing Report Summary:', {
      higherRatesForFile1: pricingReport.higherRatesForFile1.length,
      higherRatesForFile2: pricingReport.higherRatesForFile2.length,
      sameRates: pricingReport.sameRates.length,
      nonMatchingCodes: pricingReport.nonMatchingCodes.length,
    });
    console.log('Code Report Summary:', codeReport);

    expect(end - start).toBeLessThan(5000) // Ensure it runs within 5 seconds
    expect(file1Data.length).toBeGreaterThan(0)
    expect(file2Data.length).toBeGreaterThan(0)
    expect(pricingReport.higherRatesForFile1.length +
      pricingReport.higherRatesForFile2.length +
      pricingReport.sameRates.length).toBeGreaterThan(0)
    expect(codeReport.matchedCodes + codeReport.nonMatchedCodes).toBeGreaterThan(0)
  })
})
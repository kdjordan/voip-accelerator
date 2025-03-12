import { DBName, type DBNameType } from '@/types/app-types';
import { useAzStore } from '@/stores/az-store';
import { useUsStore } from '@/stores/us-store';
import useDexieDB from '@/composables/useDexieDB';
import { AZService } from '@/services/az.service';
import { USService } from '@/services/us.service';
import { USColumnRole } from '@/types/domains/us-types';

function getStoreNameFromFile(fileName: string): string {
  return fileName.replace('.csv', '');
}

/**
 * Process US CSV data to convert the NPA/NXX columns into a standard 6-digit NPANXX format
 * This handles the case where a leading "1" (country code) might be present in the NPA
 */
function processUSCsvData(csvText: string): string {
  const lines = csvText.split('\n');
  const processedLines = lines.map(line => {
    if (!line.trim()) return line; // Skip empty lines

    const cols = line.split(',');
    if (cols.length < 6) return line; // Skip malformed lines
    
    // Extract the relevant parts
    const destinationName = cols[0]; // "USA - AK"
    let npa = cols[1]; // "1907"
    const nxx = cols[2]; // "200"
    
    // Remove country code "1" if present at the beginning of NPA
    if (npa.startsWith('1') && npa.length === 4) {
      npa = npa.substring(1); // Remove the leading "1"
      console.log(`Removed leading "1" from NPA: ${cols[1]} -> ${npa}`);
    }
    
    // Ensure NPA is 3 digits and NXX is 3 digits
    if (npa.length !== 3) {
      console.warn(`NPA "${npa}" is not 3 digits after processing. This may cause validation issues.`);
    }
    
    // Combine to form a 6-digit NPANXX
    const npanxx = npa + nxx;
    
    // Check if the resulting NPANXX is 6 digits
    if (npanxx.length !== 6) {
      console.warn(`Generated NPANXX "${npanxx}" is not 6 digits (${npanxx.length}). This may cause validation issues.`);
    }
    
    // Reconstruct the line with the NPANXX as the first data column
    const newLine = [
      npanxx,
      cols[3], // interstate
      cols[4], // intrastate
      cols[5]  // indeterminate
    ].join(',');
    
    return newLine;
  });
  
  return processedLines.join('\n');
}

export async function loadSampleDecks(dbNames: DBNameType[]): Promise<void> {
  const { storeInDexieDB } = useDexieDB();
  const azStore = useAzStore();
  const usStore = useUsStore();
  const azService = new AZService();
  const usService = new USService();

  try {
    console.log('Starting sample deck loading for:', dbNames);

    if (dbNames.includes(DBName.AZ)) {
      // Load AZ-Test1.csv data
      const azTestFile = 'AZ-Test1.csv';
      const azTestResponse = await fetch(`/src/data/sample/${azTestFile}`);
      const azTestBlob = new File([await azTestResponse.blob()], azTestFile);

      // Column mapping structure for AZService
      const columnMapping = {
        destination: 0, // Index of destination column
        dialcode: 1, // Index of dialcode column
        rate: 2, // Index of rate column
      };

      const result = await azService.processFile(azTestBlob, columnMapping, 1);
      await azStore.addFileUploaded('az1', result.fileName);

      // Load AZ-Test2.csv data
      const azTest2File = 'AZ-Test2.csv';
      const azTest2Response = await fetch(`/src/data/sample/${azTest2File}`);
      const azTest2Blob = new File([await azTest2Response.blob()], azTest2File);

      const result2 = await azService.processFile(azTest2Blob, columnMapping, 1);
      await azStore.addFileUploaded('az2', result2.fileName);
    }

    if (dbNames.includes(DBName.US)) {
      console.log('Loading US sample data');
      
      // Load first US test file - UStest.csv
      const usTestFile = 'UStest.csv';
      const usTestResponse = await fetch(`/src/data/sample/${usTestFile}`);
      const csvText1 = await usTestResponse.text();
      
      // Process the CSV to create valid NPANXX format (standard is 6 digits, 3 for NPA + 3 for NXX)
      // This handles the case where a leading "1" might be present in the NPA
      const processedCSV1 = processUSCsvData(csvText1);
      const usTestBlob = new File([processedCSV1], usTestFile);

      // Debug: Show the processed content
      const firstFewLines = processedCSV1.split('\n').slice(0, 5).join('\n');
      console.log('Processed UStest.csv content:', firstFewLines);

      // Create tables directly in the database
      const db = await usService.initializeDB();
      
      // Make sure the table exists
      if (!db.tables.some(t => t.name === usTestFile.toLowerCase().replace('.csv', ''))) {
        await db.close();
        console.log('Creating table for', usTestFile);
        db.version(db.verno! + 1).stores({
          [usTestFile.toLowerCase().replace('.csv', '')]: '++id, npanxx, npa, nxx, interRate, intraRate, indetermRate',
        });
        await db.open();
      }
      
      // Parse the CSV data manually to control exactly how it's processed
      const parsedData = processedCSV1.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [npanxx, interRateStr, intraRateStr, indetermRateStr] = line.split(',');
          
          // Extract NPA and NXX from NPANXX
          const npa = npanxx.substring(0, 3);
          const nxx = npanxx.substring(3, 6);
          
          // Parse rates as floats
          const interRate = parseFloat(interRateStr);
          const intraRate = parseFloat(intraRateStr);
          const indetermRate = parseFloat(indetermRateStr);
          
          return {
            npanxx,
            npa,
            nxx,
            interRate,
            intraRate,
            indetermRate
          };
        });
      
      console.log('Parsed data from UStest.csv:', parsedData);
      
      // Store data directly in the database
      console.log('Storing data in ustest');
      await db.table(usTestFile.toLowerCase().replace('.csv', '')).bulkPut(parsedData);
      
      // Register file in store
      usStore.addFileUploaded('us1', usTestFile);
      console.log('First US file loaded successfully:', usTestFile);
      
      // Load second US test file - UStest1.csv
      const usTest2File = 'UStest1.csv';
      const usTest2Response = await fetch(`/src/data/sample/${usTest2File}`);
      const csvText2 = await usTest2Response.text();
      
      // Process the second CSV the same way
      const processedCSV2 = processUSCsvData(csvText2);
      const usTest2Blob = new File([processedCSV2], usTest2File);

      // Debug: Show the processed content
      const firstFewLines2 = processedCSV2.split('\n').slice(0, 5).join('\n');
      console.log('Processed UStest1.csv content:', firstFewLines2);
      
      // Make sure the second table exists
      if (!db.tables.some(t => t.name === usTest2File.toLowerCase().replace('.csv', ''))) {
        await db.close();
        console.log('Creating table for', usTest2File);
        db.version(db.verno! + 1).stores({
          [usTest2File.toLowerCase().replace('.csv', '')]: '++id, npanxx, npa, nxx, interRate, intraRate, indetermRate',
        });
        await db.open();
      }
      
      // Parse the second CSV data the same way
      const parsedData2 = processedCSV2.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [npanxx, interRateStr, intraRateStr, indetermRateStr] = line.split(',');
          
          // Extract NPA and NXX from NPANXX
          const npa = npanxx.substring(0, 3);
          const nxx = npanxx.substring(3, 6);
          
          // Parse rates as floats
          const interRate = parseFloat(interRateStr);
          const intraRate = parseFloat(intraRateStr);
          const indetermRate = parseFloat(indetermRateStr);
          
          return {
            npanxx,
            npa,
            nxx,
            interRate,
            intraRate,
            indetermRate
          };
        });
      
      console.log('Parsed data from UStest1.csv:', parsedData2);
      
      // Store data directly in the database
      console.log('Storing data in ustest1');
      await db.table(usTest2File.toLowerCase().replace('.csv', '')).bulkPut(parsedData2);
      
      // Register file in store
      usStore.addFileUploaded('us2', usTest2File);
      console.log('Second US file loaded successfully:', usTest2File);
      
      console.log('US sample data stored directly in database');
    }

    console.log('Sample decks loaded successfully');
  } catch (error) {
    console.error('Error loading sample decks:', error);
    throw error;
  }
}

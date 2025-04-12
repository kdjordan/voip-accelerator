import { DBName, type DBNameType } from '@/types/app-types';
import { useAzStore } from '@/stores/az-store';
import { useUsStore } from '@/stores/us-store';
import { AZService } from '@/services/az.service';
import { USService } from '@/services/us.service';
import { USColumnRole } from '@/types/domains/us-types';
import { USNPAAnalyzerService } from '@/services/us-npa-analyzer.service';

function getStoreNameFromFile(fileName: string): string {
  return fileName.replace('.csv', '');
}


export async function loadSampleDecks(dbNames: DBNameType[]): Promise<void> {
  const azStore = useAzStore();
  const usStore = useUsStore();

  try {
    console.log('Starting sample deck loading for:', dbNames);

    if (dbNames.includes(DBName.AZ)) {
      const azService = new AZService();

      // Load AZ-Test1.csv data
      const azTestFile = 'AZ-Test1.csv';
      const azTestResponse = await fetch(`/src/data/sample/${azTestFile}`);
      const azTestBlob = new File([await azTestResponse.blob()], azTestFile);

      // Column mapping structure for AZService
      const columnMapping = {
        destName: 0, // Index of destination column
        code: 1, // Index of dialcode column
        rate: 2, // Index of rate column
      };

      try {
        console.log(`Processing ${azTestFile}...`);
        const result = await azService.processFile(azTestBlob, columnMapping, 1);
        console.log(`Sample data loaded for ${azTestFile}: ${result.records.length} records`);
        await azStore.addFileUploaded('az1', result.fileName);
      } catch (error) {
        console.error(`Error loading sample data for ${azTestFile}:`, error);
      }

      // Load AZ-Test2.csv data
      const azTest2File = 'AZ-Test2.csv';
      const azTest2Response = await fetch(`/src/data/sample/${azTest2File}`);
      const azTest2Blob = new File([await azTest2Response.blob()], azTest2File);

      try {
        console.log(`Processing ${azTest2File}...`);
        const result2 = await azService.processFile(azTest2Blob, columnMapping, 1);
        console.log(`Sample data loaded for ${azTest2File}: ${result2.records.length} records`);
        await azStore.addFileUploaded('az2', result2.fileName);
      } catch (error) {
        console.error(`Error loading sample data for ${azTest2File}:`, error);
      }
    }

    if (dbNames.includes(DBName.US)) {
      console.log('Loading US sample data');
      const usService = new USService();
      const analyzer = new USNPAAnalyzerService();

      // First, clean up any existing data
      try {
        await usService.clearData();
        console.log('Cleared existing US data');
      } catch (error) {
        console.error('Error clearing US data:', error);
      }

      // Load first US test file - UStest.csv
      const usTestFile = 'UStest.csv';
      const usTestResponse = await fetch(`/src/data/sample/${usTestFile}`);
      const usTestBlob = new File([await usTestResponse.blob()], usTestFile);

      // Column mapping for UStest.csv based on actual file structure:
      const columnMapping1 = {
        npanxx: 0,
        interstate: 1,
        intrastate: 2,
        indeterminate: 3,
        npa: -1,
        nxx: -1,
      };

      console.log('Processing first US test file with column mapping:', columnMapping1);

      try {
        // Clear any existing registration and data
        usStore.removeFile('us1');
        await usService.removeTable(usTestFile.toLowerCase().replace('.csv', ''));

        // Process the file with the service
        const result1 = await usService.processFile(usTestBlob, columnMapping1, 1);
      

        // Explicitly register as us1
        usStore.addFileUploaded('us1', usTestFile);

        // Analyze the NPAs for the first file
        console.log(`[Sample] Starting NPA analysis for ${usTestFile}`);
        const tableName = usTestFile.toLowerCase().replace('.csv', '');
        const enhancedReport = await analyzer.analyzeTableNPAs(tableName, usTestFile);
        console.log(`[Sample] NPA analysis completed for ${usTestFile}:`, enhancedReport);
      } catch (error) {
        console.error('Error processing first US file:', error);
      }

      // Load second US test file - UStest1.csv
      const usTest2File = 'UStest1.csv';
      const usTest2Response = await fetch(`/src/data/sample/${usTest2File}`);
      const usTest2Blob = new File([await usTest2Response.blob()], usTest2File);

      // Column mapping for UStest1.csv (same structure)
      const columnMapping2 = {
        npanxx: 0,
        interstate: 1,
        intrastate: 2,
        indeterminate: 2,
        npa: -1,
        nxx: -1,
      };

      try {
        // Clear any existing registration and data
        usStore.removeFile('us2');
        await usService.removeTable(usTest2File.toLowerCase().replace('.csv', ''));

        // Process the file with the service
        const result2 = await usService.processFile(usTest2Blob, columnMapping2, 1);
       

        // Explicitly register as us2
        usStore.addFileUploaded('us2', usTest2File);

        // Analyze the NPAs for the second file
        console.log(`[Sample] Starting NPA analysis for ${usTest2File}`);
        const tableName2 = usTest2File.toLowerCase().replace('.csv', '');
        const enhancedReport2 = await analyzer.analyzeTableNPAs(tableName2, usTest2File);
        console.log(`[Sample] NPA analysis completed for ${usTest2File}:`, enhancedReport2);

        console.log('Both US files loaded - files are ready for report generation');
      } catch (error) {
        console.error('Error processing second US file:', error);
      }
    }

    console.log('Sample decks loaded successfully');
  } catch (error) {
    console.error('Error loading sample decks:', error);
    throw error;
  }
}


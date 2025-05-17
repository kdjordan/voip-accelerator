import { DBName, type DBNameType } from '@/types/app-types';
import { useAzStore } from '@/stores/az-store';
import { useUsStore } from '@/stores/us-store';
import { AZService } from '@/services/az.service';
import { USService } from '@/services/us.service';
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

      // Clear existing AZ data first
      try {
        console.log('[Sample] Clearing existing AZ data...');
        await azService.clearData();
        console.log('[Sample] Existing AZ data cleared.');
      } catch (error) {
        console.error('[Sample] Error clearing AZ data:', error);
      }

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
        console.log(`[Sample][az-test1] Processing ${azTestFile}...`);
        const result = await azService.processFile(azTestBlob, columnMapping, 1, 'az1');
        // Log the number of records processed BEFORE attempting to store
        console.log(
          `[Sample][az-test1] Parsed ${result.records.length} valid records from ${azTestFile}.`
        );
        console.log(
          `[Sample][az-test1] processFile promise resolved successfully for ${azTestFile}. Table should contain data.`
        );
        // Add a small delay AFTER processFile (which might have done a schema upgrade)
        // and BEFORE calculateFileStats (which reads)
        await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 100ms
        // Explicitly call calculateFileStats AFTER processFile completes
        await azService.calculateFileStats('az1', azTestFile);
        console.log(`[Sample][az-test1] calculateFileStats completed for ${azTestFile}.`);
      } catch (error) {
        console.error(
          `[Sample][az-test1] Error loading or processing sample data for ${azTestFile}:`,
          error
        );
      }

      // Load AZ-Test2.csv data
      const azTest2File = 'AZ-Test2.csv';
      const azTest2Response = await fetch(`/src/data/sample/${azTest2File}`);
      const azTest2Blob = new File([await azTest2Response.blob()], azTest2File);

      try {
        console.log(`Processing ${azTest2File}...`);
        const result2 = await azService.processFile(azTest2Blob, columnMapping, 1, 'az2');
        console.log(`Sample data loaded for ${azTest2File}: ${result2.records.length} records`);
        // Add a small delay AFTER processFile (which might have done a schema upgrade)
        // and BEFORE calculateFileStats (which reads)
        await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 100ms
        // Explicitly call calculateFileStats AFTER processFile completes
        await azService.calculateFileStats('az2', azTest2File);
        console.log(`[Sample][az-test2] calculateFileStats completed for ${azTest2File}.`);
      } catch (error) {
        console.error(`Error loading or processing sample data for ${azTest2File}:`, error);
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
        await usService.processFile(usTestBlob, columnMapping1, 1);

        // Re-introduce NPA analysis call after processing
        console.log(`[Sample] Starting NPA analysis for ${usTestFile}`);
        const tableName1 = usTestFile.toLowerCase().replace('.csv', '');
        // Ensure data is ready before analyzing (processFile awaits Dexie write)
        const enhancedReport1 = await analyzer.analyzeTableNPAs(tableName1, usTestFile);
        console.log(`[Sample] NPA analysis completed for ${usTestFile}:`, enhancedReport1);
      } catch (error) {
        console.error('Error processing first US file:', error);
      }

      // Load second US test file - UStest1.csv
      const usTest2File = 'UStest1.csv';
      const usTest2Response = await fetch(`/src/data/sample/${usTest2File}`);
      const usTest2Blob = new File([await usTest2Response.blob()], usTest2File);

      // Column mapping for UStest1.csv (assuming same structure: NPANXX, Inter, Intra, Indeterm)
      const columnMapping2 = {
        npanxx: 0,
        interstate: 1,
        intrastate: 2,
        indeterminate: 3,
        npa: -1,
        nxx: -1,
      };

      try {
        // Clear any existing registration and data
        usStore.removeFile('us2');
        await usService.removeTable(usTest2File.toLowerCase().replace('.csv', ''));

        // Process the file with the service
        await usService.processFile(usTest2Blob, columnMapping2, 1);

        // Re-introduce NPA analysis call after processing
        console.log(`[Sample] Starting NPA analysis for ${usTest2File}`);
        const tableName2 = usTest2File.toLowerCase().replace('.csv', '');
        // Ensure data is ready before analyzing (processFile awaits Dexie write)
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

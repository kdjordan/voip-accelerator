import { DBName } from '@/types/app-types';
import useDexieDB from '@/composables/useDexieDB';
import { useLergStore } from '@/stores/lerg-store';
import { useUsStore } from '@/stores/us-store';
import type { USEnhancedCodeReport, USStandardizedData } from '@/types/domains/us-types';
import NPAAnalyzerWorker from '@/workers/us-npa-analyzer.worker?worker';

export class USNPAAnalyzerService {
  /**
   * Analyze NPAs in a specified table and generate an enhanced code report
   * @param tableName The name of the table to analyze (from IndexedDB)
   * @param fileName The original file name (for display purposes)
   * @returns A promise that resolves to the enhanced code report
   */
  async analyzeTableNPAs(tableName: string, fileName: string): Promise<USEnhancedCodeReport> {
    console.log(`[NPAAnalyzer] Starting analysis for table: ${tableName}, file: ${fileName}`);

    try {
      // 1. Load the data from IndexedDB
      const data = await this.loadDataFromTable(tableName);
      console.log(`[NPAAnalyzer] Loaded ${data.length} records from table`);

      // 2. Prepare LERG data for the worker
      const lergData = this.prepareLergData();
      console.log(
        `[NPAAnalyzer] Prepared LERG data with ${Object.keys(lergData.stateNPAs).length} states`
      );

      // 3. Create and use the worker
      return await this.processWithWorker(tableName, fileName, data, lergData);
    } catch (error) {
      console.error(`[NPAAnalyzer] Error analyzing table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Load data from IndexedDB table using useDexieDB
   */
  private async loadDataFromTable(tableName: string): Promise<USStandardizedData[]> {
    const { loadFromDexieDB } = useDexieDB();

    try {
      const data = await loadFromDexieDB<USStandardizedData>(DBName.US, tableName);
      return data;
    } catch (error) {
      console.error(`[NPAAnalyzer] Error loading data from table ${tableName}:`, error);
      return []; // Return empty array instead of throwing to allow analysis to continue
    }
  }

  /**
   * Prepare LERG data for the worker in the correct format
   */
  private prepareLergData() {
    const lergStore = useLergStore();

    // Create state-to-NPAs mapping
    const stateNPAs: Record<string, string[]> = {};

    // Get US states NPAs from LERG store
    const usStates = lergStore.getUSStates;
    usStates.forEach((state) => {
      stateNPAs[state.code] = state.npas;
    });

    // Get Canadian provinces NPAs
    const canadaProvinces = lergStore.getCanadianProvinces;
    canadaProvinces.forEach((province) => {
      stateNPAs[province.code] = province.npas;
    });

    // Get country data in the right format
    const countryData = lergStore.getCountryData.map((country) => ({
      country: country.country,
      npaCount: country.npaCount,
      npas: [...country.npas], // Create a new array with primitive values
    }));

    return {
      stateNPAs,
      countryData,
    };
  }

  /**
   * Process data with the worker and return the enhanced code report
   */
  private async processWithWorker(
    tableName: string,
    fileName: string,
    data: USStandardizedData[],
    lergData: any
  ): Promise<USEnhancedCodeReport> {
    return new Promise<USEnhancedCodeReport>((resolve, reject) => {
      const worker = new NPAAnalyzerWorker();

      // Set up timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.error(`[NPAAnalyzer] Worker timeout for ${fileName} after 15 seconds`);
        worker.terminate();
        reject(new Error('Worker timeout after 15 seconds'));
      }, 15000);

      worker.onmessage = (event) => {
        clearTimeout(timeout);

        // Check for worker-specific data request
        if (event.data && event.data.type === 'REQUEST_DATA') {
          // The worker should never actually request data this way since we're
          // already passing the data directly, but handle it just in case
          worker.postMessage({
            type: 'DATA_RESPONSE',
            tableName: event.data.tableName,
            data: data,
          });
          return;
        }

        // Check if the event data contains an error
        if (event.data && event.data.error) {
          console.error(`[NPAAnalyzer] Worker error: ${event.data.error}`);
          worker.terminate();
          reject(new Error(event.data.error));
          return;
        }

        // Validate the report structure
        if (!event.data || !event.data.file1) {
          console.error(`[NPAAnalyzer] Invalid report format from worker`);
          worker.terminate();
          reject(new Error('Invalid report format received from worker'));
          return;
        }

        const report = event.data as USEnhancedCodeReport;

        // Make sure the filename is set
        if (!report.file1.fileName) {
          report.file1.fileName = fileName;
        }

        // Store the report in the store
        const usStore = useUsStore();
        usStore.setEnhancedCodeReport(report);

        worker.terminate();
        resolve(report);
      };

      worker.onerror = (error) => {
        clearTimeout(timeout);
        console.error(`[NPAAnalyzer] Worker error for ${fileName}:`, error);
        worker.terminate();
        reject(error);
      };

      // Send data to the worker
      const input = {
        tableName,
        fileName,
        lergData,
        fileData: data, // Pass the actual data to avoid needing to request it later
      };

      console.log(`[NPAAnalyzer] Sending data to worker for ${fileName}`);
      worker.postMessage(input);
    });
  }
}

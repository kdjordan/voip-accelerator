import type { RateGenRecord, ProviderInfo } from '@/types/domains/rate-gen-types';
import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types/app-types';

interface TestScenario {
  name: string;
  description: string;
  providers: TestProvider[];
}

interface TestProvider {
  id: string;
  name: string;
  fileName: string;
  recordCount: number;
  rateRange: { min: number; max: number };
}

export class TestDataService {
  private dexieDB = useDexieDB();

  // Test scenarios
  private scenarios: TestScenario[] = [
    {
      name: 'small',
      description: '2 Providers - Quick Testing (1K rates each)',
      providers: [
        {
          id: 'provider1',
          name: 'Test Provider A',
          fileName: 'test-provider-a.csv',
          recordCount: 1000,
          rateRange: { min: 0.001, max: 0.05 }
        },
        {
          id: 'provider2',
          name: 'Test Provider B',
          fileName: 'test-provider-b.csv',
          recordCount: 1000,
          rateRange: { min: 0.002, max: 0.06 }
        }
      ]
    },
    {
      name: 'medium',
      description: '3 Providers - Normal Testing (10K rates each)',
      providers: [
        {
          id: 'provider1',
          name: 'Verizon Test',
          fileName: 'verizon-test.csv',
          recordCount: 10000,
          rateRange: { min: 0.0008, max: 0.045 }
        },
        {
          id: 'provider2',
          name: 'AT&T Test',
          fileName: 'att-test.csv',
          recordCount: 10000,
          rateRange: { min: 0.0009, max: 0.048 }
        },
        {
          id: 'provider3',
          name: 'T-Mobile Test',
          fileName: 'tmobile-test.csv',
          recordCount: 10000,
          rateRange: { min: 0.001, max: 0.05 }
        }
      ]
    },
    {
      name: 'large',
      description: '5 Providers - Performance Testing (50K rates each)',
      providers: [
        {
          id: 'provider1',
          name: 'MegaTel Test',
          fileName: 'megatel-test.csv',
          recordCount: 50000,
          rateRange: { min: 0.0005, max: 0.08 }
        },
        {
          id: 'provider2',
          name: 'GlobalCom Test',
          fileName: 'globalcom-test.csv',
          recordCount: 50000,
          rateRange: { min: 0.0006, max: 0.085 }
        },
        {
          id: 'provider3',
          name: 'NetLink Test',
          fileName: 'netlink-test.csv',
          recordCount: 50000,
          rateRange: { min: 0.0007, max: 0.09 }
        },
        {
          id: 'provider4',
          name: 'TeleMax Test',
          fileName: 'telemax-test.csv',
          recordCount: 50000,
          rateRange: { min: 0.0008, max: 0.095 }
        },
        {
          id: 'provider5',
          name: 'ConnectPlus Test',
          fileName: 'connectplus-test.csv',
          recordCount: 50000,
          rateRange: { min: 0.0009, max: 0.1 }
        }
      ]
    },
    {
      name: 'edge',
      description: 'Edge Cases - Testing Error Handling',
      providers: [
        {
          id: 'provider1',
          name: 'Zero Rates Provider',
          fileName: 'zero-rates.csv',
          recordCount: 100,
          rateRange: { min: 0, max: 0 }
        },
        {
          id: 'provider2',
          name: 'High Rates Provider',
          fileName: 'high-rates.csv',
          recordCount: 100,
          rateRange: { min: 1.0, max: 5.0 }
        },
        {
          id: 'provider3',
          name: 'Mixed Valid/Invalid',
          fileName: 'mixed-data.csv',
          recordCount: 100,
          rateRange: { min: -0.01, max: 0.05 } // Negative rates for testing
        }
      ]
    }
  ];

  /**
   * Check if test mode is enabled
   */
  isTestModeEnabled(): boolean {
    // Check environment variable
    if (import.meta.env.VITE_ENABLE_TEST_DATA === 'true') {
      return true;
    }
    
    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('testMode') === 'true';
  }

  /**
   * Get available test scenarios
   */
  getScenarios(): TestScenario[] {
    return this.scenarios;
  }

  /**
   * Generate test rate data for a provider
   */
  private generateRateData(provider: TestProvider): RateGenRecord[] {
    const records: RateGenRecord[] = [];
    const usedPrefixes = new Set<string>();
    
    // Generate unique NPANXX prefixes
    for (let i = 0; i < provider.recordCount; i++) {
      let prefix: string;
      
      // Ensure unique prefixes
      do {
        const npa = Math.floor(Math.random() * 800) + 200; // NPA: 200-999
        const nxx = Math.floor(Math.random() * 800) + 200; // NXX: 200-999
        prefix = `${npa}${nxx}`;
      } while (usedPrefixes.has(prefix));
      
      usedPrefixes.add(prefix);
      
      // Generate rates within the specified range
      const baseRate = this.randomInRange(provider.rateRange.min, provider.rateRange.max);
      
      // Add some variation for intrastate and indeterminate rates
      const intraRate = baseRate * (1 + Math.random() * 0.2 - 0.1); // ±10% variation
      const indeterminateRate = baseRate * (1 + Math.random() * 0.3 - 0.15); // ±15% variation
      
      records.push({
        id: `${provider.id}-${prefix}`,
        prefix,
        rateInter: this.roundToSixDecimals(baseRate),
        rateIntra: this.roundToSixDecimals(intraRate),
        rateIndeterminate: this.roundToSixDecimals(indeterminateRate),
        providerId: provider.id,
        providerName: provider.name,
        uploadDate: new Date()
      });
    }
    
    return records;
  }

  /**
   * Load test data for a specific scenario
   */
  async loadTestData(
    scenarioName: string,
    onProgress?: (providerId: string, progress: number) => void
  ): Promise<ProviderInfo[]> {
    const scenario = this.scenarios.find(s => s.name === scenarioName);
    if (!scenario) {
      throw new Error(`Test scenario '${scenarioName}' not found`);
    }

    console.log(`[TestDataService] Loading test scenario: ${scenario.description}`);
    
    const providers: ProviderInfo[] = [];
    
    for (const testProvider of scenario.providers) {
      // Simulate progress updates
      if (onProgress) {
        onProgress(testProvider.id, 0);
      }
      
      // Generate rate data
      const rateData = this.generateRateData(testProvider);
      
      // Simulate progress during generation
      if (onProgress) {
        onProgress(testProvider.id, 30);
      }
      
      // Store in IndexedDB in chunks (simulate real upload behavior)
      const CHUNK_SIZE = 5000;
      const chunks = Math.ceil(rateData.length / CHUNK_SIZE);
      
      for (let i = 0; i < chunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, rateData.length);
        const chunk = rateData.slice(start, end);
        
        await this.storeChunk(chunk, testProvider);
        
        if (onProgress) {
          const progress = 30 + ((i + 1) / chunks) * 60; // 30% to 90%
          onProgress(testProvider.id, Math.round(progress));
        }
        
        // Small delay to simulate processing
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Calculate average rates
      const avgInterRate = rateData.reduce((sum, record) => sum + record.rateInter, 0) / rateData.length;
      const avgIntraRate = rateData.reduce((sum, record) => sum + record.rateIntra, 0) / rateData.length;
      const avgIndeterminateRate = rateData.reduce((sum, record) => sum + record.rateIndeterminate, 0) / rateData.length;
      
      // Create provider info
      const providerInfo: ProviderInfo = {
        id: testProvider.id,
        name: testProvider.name,
        fileName: testProvider.fileName,
        uploadDate: new Date(),
        recordCount: testProvider.recordCount,
        invalidRowCount: 0,
        avgInterRate: this.roundToSixDecimals(avgInterRate),
        avgIntraRate: this.roundToSixDecimals(avgIntraRate),
        avgIndeterminateRate: this.roundToSixDecimals(avgIndeterminateRate)
      };
      
      providers.push(providerInfo);
      
      if (onProgress) {
        onProgress(testProvider.id, 100);
      }
      
      console.log(`[TestDataService] Loaded ${testProvider.recordCount} records for ${testProvider.name}`);
    }
    
    return providers;
  }

  /**
   * Store a chunk of data
   */
  private async storeChunk(data: RateGenRecord[], provider: TestProvider): Promise<void> {
    const { storeInDexieDB } = this.dexieDB;
    
    await storeInDexieDB(
      data,
      DBName.RATE_GEN,
      'providers',
      { 
        replaceExisting: false,
        sourceFile: `${provider.id}:${provider.fileName}`
      }
    );
  }

  /**
   * Clear all test data
   */
  async clearTestData(): Promise<void> {
    const { clearDexieTable } = this.dexieDB;
    await clearDexieTable(DBName.RATE_GEN, 'providers');
    console.log('[TestDataService] Test data cleared');
  }

  /**
   * Helper to generate random number in range
   */
  private randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Round to 6 decimal places
   */
  private roundToSixDecimals(value: number): number {
    return Math.round(value * 1000000) / 1000000;
  }
}
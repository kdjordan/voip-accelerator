import { LergService } from '@/services/lerg.service';
import { useLergStore } from '@/stores/lerg-store';
import { LERGRecord } from '@/types/lerg-types';
const LERG_URL = '/api/lerg';
const ADMIN_URL = '/api/admin/lerg';

interface CountryBreakdown {
  countryCode: string;
  count: number;
  npaCodes: string[];
}

export const lergApiService = {
  async initialize(): Promise<void> {
    const store = useLergStore();
    const service = new LergService();

    try {
      store.lerg.isProcessing = true;
      store.specialCodes.isProcessing = true;

      // 1. Test database connection
      const hasServerData = await this.testConnection();
      console.log('Server data status:', hasServerData);

      // 2. Fetch special codes data (smaller dataset)
      const specialCodesData = await this.getSpecialCodesData();
      await service.initializeSpecialCodesTable(specialCodesData.data || []);

      // Update store with special codes immediately
      store.$patch({
        specialCodes: {
          stats: {
            totalCodes: specialCodesData.stats?.totalCodes || 0,
            countryBreakdown: specialCodesData.stats?.countryBreakdown || [],
            lastUpdated: specialCodesData.stats?.lastUpdated || null,
          },
          isLocallyStored: specialCodesData.data?.length > 0,
          data: specialCodesData.data || [],
        },
      });

      // 3. Initialize IndexDB with whatever data we have
      const lergData = await this.getLergData();
      await service.initializeLergTable(lergData.data || []);

      // 4. Update store with LERG data
      store.$patch({
        lerg: {
          stats: {
            totalRecords: lergData.stats?.totalRecords || 0,
            lastUpdated: lergData.stats?.lastUpdated || null,
          },
          isLocallyStored: lergData.data?.length > 0,
        },
      });
    } catch (error) {
      console.error('Initialization failed:', error);
      store.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      store.lerg.isProcessing = false;
    }
  },

  transformForState(codes: Array<{ npa: string; country: string; province: string }>): CountryBreakdown[] {
    return codes.reduce((acc, code) => {
      const existing = acc.find((item: CountryBreakdown) => item.countryCode === code.country);
      if (existing) {
        existing.count++;
        existing.npaCodes.push(code.npa);
      } else {
        acc.push({
          countryCode: code.country,
          count: 1,
          npaCodes: [code.npa],
        });
      }
      return acc;
    }, [] as CountryBreakdown[]);
  },

  // Public endpoints
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${LERG_URL}/test-connection`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Connection test failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(`Connection test failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return true;
    } catch (error) {
      console.error('Database connection test failed:', {
        error,
        url: `${LERG_URL}/test-connection`,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },

  async getLergData() {
    console.log('Fetching LERG data and stats...');
    const response = await fetch(`${LERG_URL}/lerg-data`);
    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to fetch LERG data:', error);
      throw new Error('Failed to fetch LERG data');
    }
    return await response.json();
  },

  async getSpecialCodesData() {
    console.log('Fetching special codes data and stats...');
    const response = await fetch(`${LERG_URL}/special-codes-data`);
    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to fetch special codes data:', error);
      throw new Error('Failed to fetch special codes data');
    }
    return await response.json();
  },

  // Admin endpoints
  async uploadLergFile(formData: FormData, onProgress?: (progress: number) => void): Promise<void> {
    const response = await fetch(`${ADMIN_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload LERG file');
    }

    return response.json();
  },

  async clearAllData(): Promise<void> {
    const response = await fetch(`${ADMIN_URL}/clear`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Clear data error:', error);
      throw new Error('Failed to clear LERG data');
    }
  },

  async reloadSpecialCodes(): Promise<void> {
    console.log('Requesting special codes reload...');
    const response = await fetch(`${ADMIN_URL}/reload/special`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to reload special codes:', error);
      throw new Error('Failed to reload special codes');
    }

    const result = await response.json();
    console.log('Special codes reload result:', result);
  },

  async uploadSpecialCodesFile(formData: FormData): Promise<void> {
    const response = await fetch(`${ADMIN_URL}/upload/special`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to upload special codes file');
    }

    // Only refresh special codes data
    const specialCodesData = await this.getSpecialCodesData();
    const service = new LergService();
    await service.initializeSpecialCodesTable(specialCodesData.data || []);

    // Update store with just special codes
    const store = useLergStore();
    store.$patch({
      specialCodes: {
        stats: {
          totalCodes: specialCodesData.stats?.totalCodes || 0,
          countryBreakdown: specialCodesData.stats?.countryBreakdown || [],
          lastUpdated: specialCodesData.stats?.lastUpdated || null,
        },
        isLocallyStored: specialCodesData.data?.length > 0,
        data: specialCodesData.data || [],
      },
    });
  },

  async clearSpecialCodesData(): Promise<void> {
    console.log('Clearing special codes data...');
    const response = await fetch(`${ADMIN_URL}/clear/special`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to clear special codes:', error);
      throw new Error('Failed to clear special codes');
    }

    // Clear IndexDB and update store
    const lergService = new LergService();
    await lergService.clearSpecialCodesData();

    const store = useLergStore();
    store.$patch({
      specialCodes: {
        isLocallyStored: false,
        data: [],
        stats: {
          totalCodes: 0,
          lastUpdated: null,
          countryBreakdown: [],
        },
      },
    });
  },

  async uploadLergRecords(records: LERGRecord[]): Promise<void> {
    const response = await fetch('/api/admin/lerg/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload LERG records');
    }
  },
};

import type { LERGStats, LERGRecord, SpecialAreaCode } from '@/types/lerg-types';
import { LergService } from '@/services/lerg.service';
import { useLergStore } from '@/stores/lerg-store';

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

      // 1. Test database connection
      const hasServerData = await this.testConnection();
      console.log('Server data status:', hasServerData);

      // 2. Fetch both LERG and special codes data with their stats
      const [lergData, specialCodesData] = await Promise.all([
        this.getLergData().catch(error => {
          console.error('Failed to fetch LERG codes:', error);
          return { data: [], stats: { totalRecords: 0, lastUpdated: null } };
        }),
        this.getSpecialCodesData().catch(error => {
          console.error('Failed to fetch special codes:', error);
          return {
            data: [],
            stats: {
              totalCodes: 0,
              lastUpdated: null,
              countryBreakdown: [],
            },
          };
        }),
      ]);

      // 3. Initialize IndexDB with whatever data we have
      await service.initializeWithData(lergData.data || [], specialCodesData.data || []);

      // 4. Update store with data and stats
      store.$patch({
        lerg: {
          stats: {
            totalRecords: lergData.stats?.totalRecords || 0,
            lastUpdated: lergData.stats?.lastUpdated || null,
          },
          isLocallyStored: lergData.data?.length > 0,
        },
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
  async uploadLERGFile(formData: FormData) {
    const response = await fetch(`${ADMIN_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Upload error:', error);
      throw new Error('Upload failed');
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

  async uploadLergFile(formData: FormData): Promise<void> {
    const response = await fetch(`${ADMIN_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload LERG file');
    }
  },

  async uploadSpecialCodesFile(formData: FormData): Promise<void> {
    const response = await fetch(`${ADMIN_URL}/upload/special`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to upload special codes file');
    }
  },

  async clearSpecialCodesData(): Promise<void> {
    console.log('Clearing special codes data...');
    const response = await fetch(`${ADMIN_URL}/lerg/clear/special`, { method: 'DELETE' });
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
};

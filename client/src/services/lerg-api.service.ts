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

      if (!hasServerData) {
        console.log('No server data found : DB empty');
        await this.reloadSpecialCodes();
        return;
      }

      // 2. Fetch both LERG and special codes data
      const [lergResponse, specialCodes] = await Promise.all([this.getAllLergCodes(), this.getAllSpecialCodes()]);

      // Extract the data from the response
      const lergData = lergResponse.data;

      // Pass the actual data arrays to initializeWithData
      await service.initializeWithData(lergData, specialCodes);

      // 4. Transform special codes for UI
      const countryBreakdown = this.transformForState(specialCodes);

      // 5. Get stats and update store
      const stats = await this.getStats();

      store.$patch({
        lerg: {
          stats: {
            totalRecords: stats.totalRecords,
            lastUpdated: stats.lastUpdated,
          },
          isLocallyStored: true,
        },
        specialCodes: {
          stats: {
            totalCodes: specialCodes.length,
            countryBreakdown,
            lastUpdated: new Date().toISOString(),
          },
          isLocallyStored: true,
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

  async getStats(): Promise<LERGStats> {
    const response = await fetch(`${ADMIN_URL}/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    return response.json();
  },

  // Admin endpoints
  async getAdminStats(): Promise<LERGStats> {
    const response = await fetch(`${ADMIN_URL}/stats`);
    if (!response.ok) {
      const error = await response.text();
      console.error('Stats fetch error:', error);
      throw new Error('Failed to fetch LERG stats');
    }
    return await response.json();
  },

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

  async getAllLergCodes(): Promise<LERGRecord[]> {
    console.log('Fetching all LERG codes...');
    const response = await fetch(`${ADMIN_URL}/codes/all`);
    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to fetch LERG codes:', error);
      throw new Error('Failed to fetch LERG codes');
    }
    return await response.json();
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

  async getAllSpecialCodes(): Promise<Array<{ npa: string; country: string; province: string }>> {
    console.log('Fetching all special codes...');
    const response = await fetch(`${LERG_URL}/init-special-codes`);
    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to fetch special codes:', error);
      throw new Error('Failed to fetch special codes');
    }
    return await response.json();
  },

  async uploadLergFile(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

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
};

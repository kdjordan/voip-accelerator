import type { LERGStats, LERGRecord } from '@/types/lerg-types';

const LERG_URL = '/api/lerg';
const ADMIN_URL = '/api/admin/lerg';

export const lergApiService = {
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

  async getAllSpecialCodes(retryCount = 0): Promise<Array<{ npa: string; country: string; province: string }>> {
    console.log('Fetching all special codes...');
    const response = await fetch(`${ADMIN_URL}/special-codes/all`);
    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to fetch special codes:', error);
      throw new Error('Failed to fetch special codes');
    }
    const data = await response.json();
    if (data.length === 0 && retryCount < 3) {
      console.log(`No data received, retrying (${retryCount + 1}/3)...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.getAllSpecialCodes(retryCount + 1);
    }
    console.log('API response data:', {
      length: data.length,
      sampleData: data.slice(0, 3),
    });
    return data;
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
};

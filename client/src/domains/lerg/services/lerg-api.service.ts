import type { LERGStats, LERGRecord } from '../types/types';

const BASE_URL = '/api/lerg';

export const lergApiService = {
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/test-connection`);
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
        url: `${BASE_URL}/test-connection`,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },

  async getStats(): Promise<LERGStats> {
    const response = await fetch(`${BASE_URL}/stats`);
    if (!response.ok) {
      const error = await response.text();
      console.error('Stats fetch error:', error);
      throw new Error('Failed to fetch LERG stats');
    }
    return await response.json();
  },

  async uploadLERGFile(formData: FormData) {
    const response = await fetch(`${BASE_URL}/upload`, {
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
    const response = await fetch(`${BASE_URL}/clear`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Clear data error:', error);
      throw new Error('Failed to clear LERG data');
    }
  },

  async getAllLergCodes(): Promise<LERGRecord[]> {
    const response = await fetch(`${BASE_URL}/codes/all`);
    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to fetch LERG codes:', error);
      throw new Error('Failed to fetch LERG codes');
    }
    return await response.json();
  },

  async getAllSpecialCodes(): Promise<Array<{ npa: string; country: string; description: string }>> {
    const response = await fetch(`${BASE_URL}/special-codes/all`);
    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to fetch special codes:', error);
      throw new Error('Failed to fetch special codes');
    }
    return await response.json();
  },
};

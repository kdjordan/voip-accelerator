import type { LERGStats } from '../types/types';

const BASE_URL = '/api/admin/lerg';

export const lergApiService = {
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/test-connection`);
      if (!response.ok) throw new Error('Connection test failed');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
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
};

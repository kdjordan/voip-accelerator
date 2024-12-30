import type { LERGStats } from '../types/types';

export class LergApiService {
  private static instance: LergApiService;
  private baseUrl = '/api/lerg'; // We'll configure this in Vite later

  private constructor() {}

  public static getInstance(): LergApiService {
    if (!LergApiService.instance) {
      LergApiService.instance = new LergApiService();
    }
    return LergApiService.instance;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/test-connection`);
      if (!response.ok) throw new Error('Connection test failed');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      throw error;
    }
  }

  async getStats(): Promise<LERGStats> {
    const response = await fetch(`${this.baseUrl}/stats`);
    if (!response.ok) throw new Error('Failed to fetch LERG stats');
    return await response.json();
  }
} 
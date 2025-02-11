import { LergService } from '@/services/lerg.service';
import { useLergStore } from '@/stores/lerg-store';

const API_BASE = '/api';
const PUBLIC_URL = `${API_BASE}/lerg`;
const ADMIN_URL = `${API_BASE}/admin/lerg`;

export const lergApiService = {
  async initialize(): Promise<void> {
    const store = useLergStore();
    const service = new LergService();

    try {
      store.isProcessing = true;
      const hasServerData = await this.testConnection();
      console.log('Server data status:', hasServerData);

      const lergData = await this.getLergData();
      await service.initializeLergTable(lergData.data || []);

      const { stateMapping, countryData } = await service.processLergData();
      store.setStateNPAs(stateMapping);
      store.setCountryData(countryData);
      store.setLergStats(lergData.stats?.totalRecords || 0);
      store.isLocallyStored = lergData.data?.length > 0;
    } catch (error) {
      console.error('Initialization failed:', error);
      store.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      store.isProcessing = false;
    }
  },

  async testConnection(): Promise<boolean> {
    const response = await fetch(`${PUBLIC_URL}/test-connection`);
    if (!response.ok) throw new Error('Failed to test connection');
    return response.json();
  },

  async getLergData() {
    const response = await fetch(`${PUBLIC_URL}/lerg-data`);
    if (!response.ok) throw new Error('Failed to fetch LERG data');
    return response.json();
  },

  async uploadLergFile(formData: FormData) {
    const response = await fetch(`${ADMIN_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload LERG file');
    return response.json();
  },

  async clearAllData(): Promise<void> {
    const response = await fetch(`${ADMIN_URL}/clear`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error('Failed to clear LERG data');
    }
  },
};

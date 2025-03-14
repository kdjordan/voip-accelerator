import { LergService } from '@/services/lerg.service';
import { useLergStore } from '@/stores/lerg-store';
import { useDBStore } from '@/stores/db-store';
import { DBName } from '@/types/app-types';

const API_BASE = '/api';
const PUBLIC_URL = `${API_BASE}/lerg`;
const ADMIN_URL = `${API_BASE}/admin/lerg`;

// Singleton instance to prevent multiple service instantiations
let lergServiceInstance: LergService | null = null;

// Flag to prevent concurrent initialization
let isInitializing = false;

export const lergApiService = {
  async initialize(): Promise<void> {
    // Prevent concurrent initialization attempts
    if (isInitializing) {
      console.log('LERG initialization already in progress, skipping duplicate call');
      return;
    }

    isInitializing = true;
    const store = useLergStore();
    const dbStore = useDBStore();

    try {
      store.isProcessing = true;
      
      // Close any existing connection to ensure clean initialization
      await dbStore.closeConnection(DBName.LERG);

      // Get or create service instance
      if (!lergServiceInstance) {
        lergServiceInstance = new LergService();
      }

      // Test connection to server
      const hasServerData = await this.testConnection();
      console.log('Server data status:', hasServerData);
      
      if (!hasServerData) {
        console.warn('No LERG data available on server');
        store.isProcessing = false;
        isInitializing = false;
        return;
      }

      // Fetch data from server
      const lergData = await this.getLergData();
      console.log(`Raw LERG data from server: ${lergData.data?.length || 0} records`);
      
      if (!lergData.data || lergData.data.length === 0) {
        console.warn('No LERG data received from server');
        store.isProcessing = false;
        isInitializing = false;
        return;
      }
      
      // Initialize database with fetched data
      await lergServiceInstance.initializeLergTable(lergData.data);

      // Process data for application use
      const { stateMapping, countryData } = await lergServiceInstance.processLergData();
      
      // Update store with processed data
      store.setStateNPAs(stateMapping);
      store.setCountryData(countryData);
      store.setLergStats(lergData.stats?.totalRecords || lergData.data.length);
      store.isLocallyStored = lergData.data.length > 0;
      
      console.log('LERG initialization completed successfully');
    } catch (error) {
      console.error('LERG Initialization failed:', error);
      store.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      store.isProcessing = false;
      isInitializing = false;
    }
  },

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${PUBLIC_URL}/test-connection`);
      if (!response.ok) throw new Error('Failed to test connection');
      return response.json();
    } catch (error) {
      console.error('Failed to test connection to LERG service:', error);
      return false;
    }
  },

  async getLergData() {
    try {
      const response = await fetch(`${PUBLIC_URL}/lerg-data`);
      if (!response.ok) throw new Error('Failed to fetch LERG data');
      return response.json();
    } catch (error) {
      console.error('Failed to fetch LERG data:', error);
      return { data: [], stats: { totalRecords: 0 } };
    }
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
    try {
      // First close any existing connections to prevent database being open
      const dbStore = useDBStore();
      await dbStore.closeConnection(DBName.LERG);
      
      // Then clear data from the server
      const response = await fetch(`${ADMIN_URL}/clear`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to clear LERG data on server');
      }
      
      // Then clear client-side data
      if (lergServiceInstance) {
        await lergServiceInstance.clearLergData();
      }
      
      console.log('LERG data cleared successfully');
    } catch (error) {
      console.error('Failed to clear LERG data:', error);
      throw error;
    }
  },
};

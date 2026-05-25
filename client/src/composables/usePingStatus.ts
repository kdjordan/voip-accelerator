import { ref } from 'vue';
import { pingResponseSchema } from '@voip-accelerator/shared';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

interface PingStatus {
  isOnline: boolean;
  error?: string;
  lastChecked: Date;
  hasLergTable: boolean;
}

export function usePingStatus() {
  const status = ref<PingStatus>({
    isOnline: false,
    lastChecked: new Date(),
    hasLergTable: false,
  });

  const checkPingStatus = async () => {
    try {
      status.value.lastChecked = new Date();

      const response = await fetch(`${API_BASE_URL}/api/ping`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = pingResponseSchema.parse(await response.json());
      status.value = {
        isOnline: data.status === 'ok',
        hasLergTable: data.hasLergTable,
        lastChecked: new Date(),
      };
    } catch (error) {
      console.error('Ping status check failed:', error);
      status.value = {
        isOnline: false,
        hasLergTable: false,
        error: error instanceof Error ? error.message : 'Failed to check ping status',
        lastChecked: new Date(),
      };
    }
  };

  return {
    status,
    checkPingStatus,
  };
}

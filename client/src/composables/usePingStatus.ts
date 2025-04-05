import { ref } from 'vue';

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

      const response = await fetch(
        'https://odnwqnmgftgjrdkotlro.supabase.co/functions/v1/ping-status',
        {
          method: 'GET',
          mode: 'cors',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      status.value = {
        isOnline: data.status === 'ok',
        hasLergTable: data.hasLergTable || false,
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

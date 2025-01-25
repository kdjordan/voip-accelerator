import { ref, onMounted } from 'vue';
import { LergLoadingStatus } from '@/types/lerg-types';
import { LergService } from '@/services/lerg.service';

export function useLergData() {
  const loadingStatus = ref<LergLoadingStatus>({
    isLoading: false,
    progress: 0,
    error: null,
    lastUpdated: null,
  });

  const lergService = new LergService();

  async function initialize() {
    try {
      loadingStatus.value.isLoading = true;
      await lergService.initializeLergData();
    } catch (error) {
      loadingStatus.value.error = error instanceof Error ? error : new Error('Unknown error');
    } finally {
      loadingStatus.value.isLoading = false;
    }
  }

  onMounted(initialize);

  return {
    loadingStatus,
    initialize,
  };
}

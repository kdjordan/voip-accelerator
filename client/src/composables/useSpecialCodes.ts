import { ref } from 'vue';
import { useLergStore } from '@/stores/lerg-store';
import { lergApiService } from '@/services/lerg-api.service';
import type { SpecialAreaCode } from '@/types/lerg-types';

export function useSpecialCodes() {
  const store = useLergStore();
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchSpecialCodesByCountry(country: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const codes = await lergApiService.getSpecialCodesByCountry(country);
      store.updateSpecialCodesForCountry(country, codes);
      return codes;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch special codes';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    isLoading,
    error,
    fetchSpecialCodesByCountry,
    specialCodes: store.filterSpecialCodesByCountry,
  };
}

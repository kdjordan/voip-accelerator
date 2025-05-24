import { ref, computed } from 'vue';
import { metroAreaOptions, type MetroAreaOption } from '@/types/constants/metro-population';

export function useMetroFilter() {
  // --- Reactive State ---
  const selectedMetros = ref<MetroAreaOption[]>([]);
  const metroSearchQuery = ref('');

  // --- Computed Properties ---
  const metroButtonLabel = computed(() => {
    if (selectedMetros.value.length === 0) return 'All Metro Areas';
    if (selectedMetros.value.length === 1) return selectedMetros.value[0].displayName;
    return `${selectedMetros.value.length} Metro Areas Selected`;
  });

  const filteredMetroOptions = computed(() => {
    if (!metroSearchQuery.value) {
      return metroAreaOptions;
    }
    return metroAreaOptions.filter((metro) =>
      metro.displayName.toLowerCase().includes(metroSearchQuery.value.toLowerCase())
    );
  });

  const totalSelectedPopulation = computed(() => {
    return selectedMetros.value.reduce((sum, metro) => sum + metro.population, 0);
  });

  const targetedNPAsDisplay = computed(() => {
    if (selectedMetros.value.length === 0) {
      return { summary: '', fullList: '' };
    }

    const allNPAs = [...new Set(selectedMetros.value.flatMap((metro) => metro.areaCodes))].sort();

    const npaListString = allNPAs.join(', ');

    if (allNPAs.length === 0) {
      return { summary: '', fullList: '' };
    }

    // The summary will now always show the full list along with the count.
    const summaryText = `Targeting ${allNPAs.length} NPAs: ${npaListString}`;

    // fullList for the title attribute (tooltip) remains the raw comma-separated list.
    return { summary: summaryText, fullList: npaListString };
  });

  const areAllMetrosSelected = computed(() => {
    // Considers if all *currently filtered* metros are selected, or all metros if no search query
    const optionsToConsider = filteredMetroOptions.value;
    if (optionsToConsider.length === 0) return false;
    return optionsToConsider.every((metro) => isMetroSelected(metro));
  });

  // This will be used by parent components to get area codes for filtering the actual data
  const metroAreaCodesToFilter = computed<string[]>(() => {
    return [...new Set(selectedMetros.value.flatMap((metro) => metro.areaCodes))];
  });

  // --- Helper Functions ---
  function toggleMetroSelection(metro: MetroAreaOption) {
    const index = selectedMetros.value.findIndex((m) => m.key === metro.key);
    if (index > -1) {
      selectedMetros.value.splice(index, 1);
    } else {
      selectedMetros.value.push(metro);
    }
  }

  function isMetroSelected(metro: MetroAreaOption): boolean {
    return selectedMetros.value.some((m) => m.key === metro.key);
  }

  function handleSelectAllMetros() {
    const currentFilteredAreSelected = areAllMetrosSelected.value;
    const optionsToConsider = filteredMetroOptions.value; // Select/deselect based on current search results

    if (currentFilteredAreSelected) {
      // Deselect all currently visible/filtered metros
      selectedMetros.value = selectedMetros.value.filter(
        (sm) => !optionsToConsider.find((fm) => fm.key === sm.key)
      );
    } else {
      // Select all currently visible/filtered metros that aren't already selected
      optionsToConsider.forEach((metro) => {
        if (!isMetroSelected(metro)) {
          selectedMetros.value.push(metro);
        }
      });
    }
  }

  function removeSelectedMetro(metro: MetroAreaOption) {
    const index = selectedMetros.value.findIndex((m) => m.key === metro.key);
    if (index > -1) {
      selectedMetros.value.splice(index, 1);
    }
  }

  function clearMetroSearch() {
    metroSearchQuery.value = '';
  }

  function clearAllSelectedMetros() {
    selectedMetros.value = [];
    metroSearchQuery.value = ''; // Also clear search
  }

  function formatPopulation(population: number): string {
    if (population >= 1000000) {
      return `${(population / 1000000).toFixed(1)}M`;
    }
    if (population >= 1000) {
      return `${(population / 1000).toFixed(1)}K`;
    }
    return population.toString();
  }

  // --- Return all state, computed properties, and functions ---
  return {
    // Reactive state
    selectedMetros,
    metroSearchQuery,

    // Computed properties
    metroButtonLabel,
    filteredMetroOptions,
    totalSelectedPopulation,
    targetedNPAsDisplay,
    areAllMetrosSelected,
    metroAreaCodesToFilter,

    // Helper functions
    toggleMetroSelection,
    isMetroSelected,
    handleSelectAllMetros,
    removeSelectedMetro,
    clearMetroSearch,
    clearAllSelectedMetros,
    formatPopulation,
  };
}

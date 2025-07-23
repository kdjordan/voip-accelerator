import { ref, watch } from 'vue';
import type { USExportFormatOptions } from '@/types/exports';
import { useLergStoreV2 } from '@/stores/lerg-store-v2';

const STORAGE_KEY = 'us-export-format-preferences';

export function useUSExportConfig() {
  const lergStore = useLergStoreV2();

  // Load saved preferences from localStorage
  const loadSavedPreferences = (): USExportFormatOptions => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load export preferences:', error);
    }

    // Default preferences
    return {
      npanxxFormat: 'combined',
      includeCountryCode: true,
      includeStateColumn: false,
      includeCountryColumn: false,
      selectedCountries: [],
      excludeCountries: false,
    };
  };

  const formatOptions = ref<USExportFormatOptions>(loadSavedPreferences());

  // Save preferences when they change
  watch(formatOptions, (newOptions) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOptions));
    } catch (error) {
      console.error('Failed to save export preferences:', error);
    }
  }, { deep: true });

  // Transform data based on format options
  function transformDataForExport(
    data: any[],
    options: USExportFormatOptions,
    exportType: 'rate-sheet' | 'comparison'
  ): { headers: string[]; rows: any[] } {
    const headers: string[] = [];
    const rows: any[] = [];

    // Apply country filter if needed
    let filteredData = data;
    if (options.selectedCountries.length > 0) {
      filteredData = data.filter(row => {
        // First check for direct country fields
        let country = row.country || row.countryCode || row.country_code;
        
        // If no direct country field, derive from NPA using LERG store
        if (!country && row.npa) {
          const npaInfo = lergStore.getNPAInfo(row.npa);
          country = npaInfo?.country_code;
        }
        
        // Fallback to US if still no country
        country = country || 'US';
        
        const isInList = options.selectedCountries.includes(country);
        return options.excludeCountries ? !isInList : isInList;
      });
    }

    // Build headers based on options
    if (options.npanxxFormat === 'split') {
      headers.push('NPA', 'NXX');
    } else {
      headers.push('NPANXX');
    }

    if (options.includeStateColumn) {
      headers.push('State');
    }

    // Add type-specific headers
    if (exportType === 'comparison') {
      headers.push(
        'Destination Name (File 1)',
        'Destination Name (File 2)',
        'Inter Rate (File 1)',
        'Inter Rate (File 2)',
        'Inter Diff %',
        'Intra Rate (File 1)',
        'Intra Rate (File 2)',
        'Intra Diff %',
        'Indeterm Rate (File 1)',
        'Indeterm Rate (File 2)',
        'Indeterm Diff %',
        'Cheaper File'
      );
    } else {
      if (options.includeCountryColumn) {
        headers.push('Country');
      }
      headers.push('Interstate Rate', 'Intrastate Rate', 'Indeterminate Rate', 'Effective Date');
    }

    // Transform rows
    filteredData.forEach(row => {
      const transformedRow: any = {};

      // Handle NPANXX
      if (options.npanxxFormat === 'split') {
        const npanxx = String(row.npanxx || '');
        const npa = npanxx.slice(0, 3);
        const nxx = npanxx.slice(3, 6).padStart(3, '0'); // Ensure 3 digits with leading zeros
        
        // Store both as strings to preserve formatting in Excel
        transformedRow['NPA'] = options.includeCountryCode ? `1${npa}` : npa;
        transformedRow['NXX'] = nxx; // String with leading zeros preserved
      } else {
        transformedRow['NPANXX'] = options.includeCountryCode 
          ? `1${row.npanxx}` 
          : String(row.npanxx || '');
      }

      // Add state if requested
      if (options.includeStateColumn) {
        transformedRow['State'] = row.state || row.stateCode || '';
      }

      // Handle type-specific fields
      if (exportType === 'comparison') {
        transformedRow['Destination Name (File 1)'] = row.destinationName || '';
        transformedRow['Destination Name (File 2)'] = row.destinationName2 || '';
        
        // Inter rates
        transformedRow['Inter Rate (File 1)'] = typeof row.file1_inter === 'number' ? row.file1_inter.toFixed(6) : (row.file1_inter || 'N/A');
        transformedRow['Inter Rate (File 2)'] = typeof row.file2_inter === 'number' ? row.file2_inter.toFixed(6) : (row.file2_inter || 'N/A');
        transformedRow['Inter Diff %'] = typeof row.diff_inter_pct === 'number' ? row.diff_inter_pct.toFixed(2) + '%' : (row.diff_inter_pct || 'N/A');
        
        // Intra rates
        transformedRow['Intra Rate (File 1)'] = typeof row.file1_intra === 'number' ? row.file1_intra.toFixed(6) : (row.file1_intra || 'N/A');
        transformedRow['Intra Rate (File 2)'] = typeof row.file2_intra === 'number' ? row.file2_intra.toFixed(6) : (row.file2_intra || 'N/A');
        transformedRow['Intra Diff %'] = typeof row.diff_intra_pct === 'number' ? row.diff_intra_pct.toFixed(2) + '%' : (row.diff_intra_pct || 'N/A');
        
        // Indeterm rates
        transformedRow['Indeterm Rate (File 1)'] = typeof row.file1_indeterm === 'number' ? row.file1_indeterm.toFixed(6) : (row.file1_indeterm || 'N/A');
        transformedRow['Indeterm Rate (File 2)'] = typeof row.file2_indeterm === 'number' ? row.file2_indeterm.toFixed(6) : (row.file2_indeterm || 'N/A');
        transformedRow['Indeterm Diff %'] = typeof row.diff_indeterm_pct === 'number' ? row.diff_indeterm_pct.toFixed(2) + '%' : (row.diff_indeterm_pct || 'N/A');
        
        transformedRow['Cheaper File'] = row.cheaperFile || '';
      } else {
        if (options.includeCountryColumn) {
          // First check for direct country fields
          let country = row.country || row.countryCode || row.country_code;
          
          // If no direct country field, derive from NPA using LERG store
          if (!country && row.npa) {
            const npaInfo = lergStore.getNPAInfo(row.npa);
            country = npaInfo?.country_code;
          }
          
          transformedRow['Country'] = country || 'US';
        }
        transformedRow['Interstate Rate'] = row.interRate || row.interstateRate || row.inter;
        transformedRow['Intrastate Rate'] = row.intraRate || row.intrastateRate || row.intra;
        transformedRow['Indeterminate Rate'] = row.indetermRate || row.indeterminateRate || row.indeterm;
        transformedRow['Effective Date'] = row.effectiveDate || '';
      }

      rows.push(transformedRow);
    });

    return { headers, rows };
  }

  // Reset to defaults
  function resetToDefaults() {
    formatOptions.value = {
      npanxxFormat: 'combined',
      includeCountryCode: true,
      includeStateColumn: false,
      includeCountryColumn: false,
      selectedCountries: [],
      excludeCountries: false,
    };
  }

  return {
    formatOptions,
    transformDataForExport,
    resetToDefaults,
  };
}
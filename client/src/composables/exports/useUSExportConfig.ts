import { ref, watch } from 'vue';
import type { USExportFormatOptions } from '@/types/exports';

const STORAGE_KEY = 'us-export-format-preferences';

export function useUSExportConfig() {
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
      includeMetroColumn: false,
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
        const country = row.country || 'US';
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
        'Rate (File 1)',
        'Rate (File 2)',
        'Difference',
        'Difference %',
        'Cheaper File'
      );
    } else {
      headers.push('Country', 'Interstate Rate', 'Intrastate Rate', 'Indeterminate Rate', 'Effective Date');
    }

    if (options.includeMetroColumn) {
      headers.push('Metro Area');
    }

    // Transform rows
    filteredData.forEach(row => {
      const transformedRow: any = {};

      // Handle NPANXX
      if (options.npanxxFormat === 'split') {
        const npanxx = String(row.npanxx || '');
        const npa = npanxx.slice(0, 3);
        const nxx = npanxx.slice(3, 6).padStart(3, '0'); // Ensure 3 digits with leading zeros
        
        // Apply country code to NPA if requested (same as preview logic)
        transformedRow['NPA'] = options.includeCountryCode ? `1${npa}` : npa;
        transformedRow['NXX'] = `'${nxx}`; // Force Excel to treat as text for consistency
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
        transformedRow['Rate (File 1)'] = row.rate;
        transformedRow['Rate (File 2)'] = row.rate2;
        transformedRow['Difference'] = row.difference;
        transformedRow['Difference %'] = row.differencePercentage;
        transformedRow['Cheaper File'] = row.cheaperFile || '';
      } else {
        transformedRow['Country'] = row.country || 'US';
        transformedRow['Interstate Rate'] = row.interRate || row.interstateRate || row.inter;
        transformedRow['Intrastate Rate'] = row.intraRate || row.intrastateRate || row.intra;
        transformedRow['Indeterminate Rate'] = row.indetermRate || row.indeterminateRate || row.indeterm;
        transformedRow['Effective Date'] = row.effectiveDate || '';
      }

      // Add metro area if requested
      if (options.includeMetroColumn) {
        transformedRow['Metro Area'] = row.metroArea || '';
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
      includeMetroColumn: false,
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
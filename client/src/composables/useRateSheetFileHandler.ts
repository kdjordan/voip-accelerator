import { ref } from 'vue';
import Papa from 'papaparse';
import type { RateSheetRow } from '@/types/rate-sheet-types';
import { useRateSheetStore } from '@/stores/rate-sheet-store';

export function useRateSheetFileHandler() {
  const store = useRateSheetStore();
  const file = ref<File | null>(null);

  async function handleFileInput(event: Event) {
    const inputFile = (event.target as HTMLInputElement).files?.[0];
    if (!inputFile) return;

    try {
      file.value = inputFile;
      return new Promise((resolve, reject) => {
        Papa.parse(inputFile, {
          header: true,
          skipEmptyLines: true,
          transformHeader: header => header.toLowerCase().trim(),
          complete: (results: Papa.ParseResult<RateSheetRow>) => {
            try {
              // Validate headers
              const requiredHeaders = ['name', 'prefix', 'rate', 'effective', 'min duration', 'increments'];
              const headers = Object.keys(results.data[0] || {});
              const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

              if (missingHeaders.length > 0) {
                reject(new Error(`Missing required columns: ${missingHeaders.join(', ')}`));
                return;
              }

              // Validate all rows first
              results.data.forEach((row, index) => {
                // Validate row data
                if (!row.name || !row.prefix || !row.rate) {
                  reject(new Error(`Invalid data in row ${index + 1}: name, prefix, and rate are required`));
                  return;
                }

                const rate = parseFloat(row.rate);
                if (isNaN(rate)) {
                  reject(new Error(`Invalid rate in row ${index + 1}: ${row.rate}`));
                  return;
                }
              });

              // If validation passes, transform the data
              const records = results.data.map(row => ({
                name: row.name,
                prefix: row.prefix,
                rate: parseFloat(row.rate),
                effective: row.effective,
                minDuration: parseInt(row['min duration'] || '1'),
                increments: parseInt(row.increments || '1'),
              }));

              // Update store state
              store.setLocallyStored(true);
              store.setOriginalData(records);
              store.setGroupedData(store.getGroupedData);
              resolve(true);
            } catch (error) {
              reject(error);
            }
          },
          error: error => {
            reject(new Error('Error parsing CSV file: ' + error.message));
          },
        });
      });
    } catch (error) {
      throw error;
    }
  }

  return {
    file,
    handleFileInput,
  };
}

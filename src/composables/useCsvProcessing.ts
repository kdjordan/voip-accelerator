import { ref } from 'vue';
import Papa from 'papaparse';
import type { StandardizedData, DBNameType, DomainStoreType } from '@/domains/shared/types';
import { DBName } from '@/domains/shared/types';
import useIndexedDB from './useIndexDB';
import { useAzStore } from '@/domains/az/store';
import { useNpanxxStore } from '@/domains/npanxx/store';
import { NPANXXRateType, USStandardizedData } from '@/domains/npanxx/types/npanxx-types';
import type { AZStandardizedData } from '@/domains/az/types/az-types';

export default function useCSVProcessing() {
  const file = ref<File | null>(null);
  const startLine = ref<number>(1);
  const columnRoles = ref<string[]>([]);
  const DBname = ref<DBNameType | null>(null);
  const componentName = ref<string>('');
  const previewData = ref<string[][]>([]);
  const columns = ref<string[]>([]);
  const showPreviewModal = ref<boolean>(false);
  const deckType = ref<DBNameType | null>(null);
  const isProcessing = ref<boolean>(false);
  const indetermRateType = ref<NPANXXRateType | null>(null);

  const { storeInIndexedDB, deleteObjectStore } = useIndexedDB();

  function getDomainStore(): DomainStoreType {
    switch (deckType.value) {
      case DBName.AZ:
        return useAzStore();
      case DBName.US:
        return useNpanxxStore();
      default:
        throw new Error(`Invalid deck type: ${deckType.value}`);
    }
  }

  async function parseCSVForFullProcessing(): Promise<StandardizedData[] | undefined> {
    const domainStore = getDomainStore();
    if (!file.value) {
      return;
    }

    try {
      if (deckType.value === DBName.AZ) {
        const processedData = await processAZData(file.value);
        return processedData;
      }
      if (deckType.value === DBName.US) {
        const processedData = await processUSData(file.value);
        return processedData;
      }
    } catch (e) {
      console.error('Error during CSV parsing', e);
      throw e;
    }
  }

  async function processUSData(fileToProcess: File): Promise<USStandardizedData[]> {
    console.log('processing US data', indetermRateType.value);
    return new Promise((resolve, reject) => {
      Papa.parse(fileToProcess, {
        header: false,
        skipEmptyLines: true,
        complete(results: { data: string[][] }) {
          const dataStartIndex = startLine.value - 1;
          const fullData = results.data.slice(dataStartIndex);
          const standardizedData: USStandardizedData[] = [];

          fullData.forEach((row: string[], rowIndex: number) => {
            const standardizedRow: USStandardizedData = {
              npa: 0,
              nxx: 0,
              interRate: 0,
              intraRate: 0,
              ijRate: 0,
            };

            let interRate = 0;
            let intraRate = 0;

            columnRoles.value.forEach((role, index) => {
              if (role && index < row.length) {
                const value = row[index].trim();

                switch (role) {
                  case 'NPA':
                    standardizedRow.npa = processNPA(value);
                    break;
                  case 'NXX':
                    standardizedRow.nxx = parseInt(value, 10);
                    break;
                  case 'NPANXX':
                    const [npa, nxx] = processNPANXX(value);
                    standardizedRow.npa = npa;
                    standardizedRow.nxx = nxx;
                    break;
                  case 'inter':
                    interRate = parseFloat(value);
                    standardizedRow.interRate = interRate;
                    break;
                  case 'intra':
                    intraRate = parseFloat(value);
                    standardizedRow.intraRate = intraRate;
                    break;
                  case 'indeterm':
                    standardizedRow.ijRate = parseFloat(value);
                    break;
                }
              }
            });

            // Handle indeterminate rate
            if (indetermRateType.value === 'inter') {
              standardizedRow.ijRate = interRate;
            } else if (indetermRateType.value === 'intra') {
              standardizedRow.ijRate = intraRate;
            } else if (indetermRateType.value === 'ij' && standardizedRow.ijRate === 0) {
              standardizedRow.ijRate = intraRate;
            }

            const isValidNPA = !isNaN(standardizedRow.npa);
            const isValidNXX = !isNaN(standardizedRow.nxx);
            const isValidRates =
              !isNaN(standardizedRow.interRate) && !isNaN(standardizedRow.intraRate) && !isNaN(standardizedRow.ijRate);

            if (isValidNPA && isValidNXX && isValidRates) {
              standardizedData.push(standardizedRow);
            } else {
              console.error('Issue parsing US file row', rowIndex, standardizedRow);
            }
          });

          resolve(standardizedData);
        },
        error: reject,
      });
    });
  }

  function processNPA(value: string): number {
    let processedNpa = value;
    if (processedNpa.startsWith('1') && processedNpa.length === 4) {
      processedNpa = processedNpa.slice(1);
    }
    return parseInt(processedNpa, 10);
  }

  function processNPANXX(value: string): [number, number] {
    let processedValue = value;
    if (processedValue.startsWith('1') && processedValue.length === 7) {
      processedValue = processedValue.slice(1);
    }
    const npa = parseInt(processedValue.slice(0, 3), 10);
    const nxx = parseInt(processedValue.slice(3), 10);
    return [npa, nxx];
  }

  async function processAZData(fileToProcess: File): Promise<AZStandardizedData[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(fileToProcess, {
        header: false,
        skipEmptyLines: true,
        complete(results: { data: string[][] }) {
          const dataStartIndex = startLine.value - 1;
          const fullData = results.data.slice(dataStartIndex);
          const standardizedData: AZStandardizedData[] = [];

          fullData.forEach((row: string[], rowIndex: number) => {
            const standardizedRow: AZStandardizedData = {
              destName: '',
              dialCode: 0,
              rate: 0,
            };

            columnRoles.value.forEach((role, index) => {
              if (role && index < row.length) {
                switch (role) {
                  case 'destName':
                    standardizedRow.destName = String(row[index]).trim();
                    break;
                  case 'dialCode':
                    standardizedRow.dialCode = Number(row[index]);
                    break;
                  case 'rate':
                    standardizedRow.rate = Number(row[index]);
                    break;
                }
              }
            });

            if (
              typeof standardizedRow.destName === 'string' &&
              typeof standardizedRow.dialCode === 'number' &&
              typeof standardizedRow.rate === 'number'
            ) {
              standardizedData.push(standardizedRow);
            }
          });

          resolve(standardizedData);
        },
        error: reject,
      });
    });
  }

  function parseCSVForPreview(uploadedFile: File) {
    return new Promise((resolve, reject) => {
      try {
        Papa.parse(uploadedFile, {
          header: false,
          preview: 25, // Only get first 25 rows for preview
          complete(results: { data: string[][] }) {
            // Get preview data
            previewData.value = results.data;
            
            // Get column headers (first row or specified start line)
            columns.value = results.data[startLine.value - 1];
            
            // Initialize empty column roles
            columnRoles.value = Array(columns.value.length).fill('');
            
            showPreviewModal.value = true;
            resolve(results.data);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            reject(error);
          }
        });
      } catch (error) {
        console.error('error uploading file', error);
        reject(error);
      }
    });
  }

  async function removeFromDB() {
    const domainStore = getDomainStore();
    const storeName = domainStore.getStoreNameByComponent(componentName.value);
    await deleteObjectStore(DBname.value as DBNameType, storeName);
  }

  return {
    file,
    startLine,
    previewData,
    columns,
    DBname,
    showPreviewModal,
    componentName,
    columnRoles,
    parseCSVForPreview,
    parseCSVForFullProcessing,
    removeFromDB,
    deckType,
    indetermRateType,
    isProcessing,
  };
}

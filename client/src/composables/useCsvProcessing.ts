import { ref } from 'vue';
import Papa from 'papaparse';
import type { StandardizedData, DBNameType, DomainStoreType } from '@/domains/shared/types';
import { DBName } from '@/domains/shared/types';
import useIndexedDB from './useIndexDB';
import { useAzStore } from '@/domains/az/store';
import { useUsStore } from '@/domains/us/store';
import { NPANXXRateType, type USStandardizedData } from '@/domains/us/types/us-types';
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
        return useUsStore();
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
              npa: '',
              nxx: '',
              npanxx: '',
              interRate: 0,
              intraRate: 0,
              ijRate: 0,
            };

            columnRoles.value.forEach((role, index) => {
              if (role && index < row.length) {
                switch (role) {
                  case 'npa':
                    standardizedRow.npa = row[index].trim();
                    break;
                  case 'nxx':
                    standardizedRow.nxx = row[index].trim();
                    break;
                  case 'npanxx':
                    const npanxxStr = row[index].trim();
                    if (npanxxStr) {
                      standardizedRow.npanxx = npanxxStr;
                      standardizedRow.npa = npanxxStr.slice(0, 3);
                      standardizedRow.nxx = npanxxStr.slice(3);
                    }
                    break;
                  case 'interRate':
                    standardizedRow.interRate = Number(row[index]);
                    break;
                  case 'intraRate':
                    standardizedRow.intraRate = Number(row[index]);
                    break;
                  case 'ijRate':
                    standardizedRow.ijRate = Number(row[index]);
                    break;
                }
              }
            });

            if (!standardizedRow.npanxx && standardizedRow.npa && standardizedRow.nxx) {
              standardizedRow.npanxx = `${standardizedRow.npa}${standardizedRow.nxx}`;
            }

            if (
              standardizedRow.npa &&
              standardizedRow.nxx &&
              (standardizedRow.interRate > 0 || standardizedRow.intraRate > 0 || standardizedRow.ijRate > 0)
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
              dialCode: '',
              rate: 0,
            };

            columnRoles.value.forEach((role, index) => {
              if (role && index < row.length) {
                switch (role) {
                  case 'destName':
                    standardizedRow.destName = String(row[index]).trim();
                    break;
                  case 'dialCode':
                    standardizedRow.dialCode = row[index].trim();
                    break;
                  case 'rate':
                    standardizedRow.rate = Number(row[index]);
                    break;
                }
              }
            });

            if (
              typeof standardizedRow.destName === 'string' &&
              standardizedRow.dialCode &&
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
          error: error => {
            console.error('Error parsing CSV:', error);
            reject(error);
          },
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

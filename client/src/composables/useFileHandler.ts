import type { DBNameType } from '@/types';
import useCSVProcessing from './useCsvProcessing';
import useIndexedDB from './xxuseIndexDB';

interface FileHandlerOptions {
  onFileAccepted: (file: File) => Promise<void>;
  onFileRemoved: () => void;
  DBname: DBNameType;
  componentName: string;
}

export function useFileHandler(options: FileHandlerOptions) {
  const csvProcessing = useCSVProcessing();
  const { storeInIndexedDB, deleteObjectStore } = useIndexedDB();

  // Initialize CSV processing with component info
  csvProcessing.deckType.value = options.DBname;
  csvProcessing.DBname.value = options.DBname;
  csvProcessing.componentName.value = options.componentName;

  async function handleFileInput(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files?.length) return;

    try {
      csvProcessing.file.value = target.files[0];
      // First process the file for preview
      await csvProcessing.parseCSVForPreview(csvProcessing.file.value);
      // Then call the callback
      await options.onFileAccepted(csvProcessing.file.value);
    } catch (error) {
      console.error('Error handling file input:', error);
    }
  }

  async function handlePreviewConfirm(confirmation: { columnRoles: string[]; startLine: number }) {
    try {
      csvProcessing.columnRoles.value = confirmation.columnRoles;
      csvProcessing.startLine.value = confirmation.startLine;
      csvProcessing.showPreviewModal.value = false;

      // Process the CSV and store in IndexDB
      const processedData = await csvProcessing.parseCSVForFullProcessing();
      if (processedData) {
        const storeName = `${options.componentName}-store`;

        // Create a new store before trying to store data
        await storeInIndexedDB(
          processedData,
          options.DBname,
          csvProcessing.file.value?.name || '',
          options.componentName,
          true // Force create new store
        );
      }
    } catch (error) {
      console.error('Error in preview confirmation:', error);
      throw error;
    }
  }

  async function handleRemoveFile() {
    try {
      const storeName = `${options.componentName}-store`;
      await deleteObjectStore(options.DBname, storeName);

      // Reset all relevant state
      csvProcessing.file.value = null;
      csvProcessing.showPreviewModal.value = false;
      csvProcessing.previewData.value = [];
      csvProcessing.columns.value = [];
      csvProcessing.columnRoles.value = [];

      await options.onFileRemoved();
    } catch (error) {
      console.error('Error removing file:', error);
      throw error;
    }
  }

  return {
    // CSV Processing State
    file: csvProcessing.file,
    showPreviewModal: csvProcessing.showPreviewModal,
    previewData: csvProcessing.previewData,
    columns: csvProcessing.columns,
    columnRoles: csvProcessing.columnRoles,
    startLine: csvProcessing.startLine,
    // Methods
    handleFileInput,
    handlePreviewConfirm,
    handlePreviewCancel: () => {
      csvProcessing.showPreviewModal.value = false;
      csvProcessing.file.value = null;
    },
    handleRemoveFile,
  };
}

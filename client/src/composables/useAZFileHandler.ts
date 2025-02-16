import { ref, reactive } from 'vue';
import { useAzStore } from '@/stores/az-store';
import Papa from 'papaparse';
import { AZColumnRole } from '@/types/az-types';
import { createDatabase, DBConfig } from '@/config/database';
import { AZService } from '@/services/az.service';

export function useAZFileHandler(service: AZService) {
  const store = useAzStore();

  // File state
  const files = reactive<Record<string, File | null>>({});
  const isProcessing = reactive<Record<string, boolean>>({});
  const isUploading = reactive<Record<string, boolean>>({});
  const isDragging = reactive<Record<string, boolean>>({});

  // Preview state
  const showPreviewModal = ref(false);
  const previewData = ref<string[][]>([]);
  const columns = ref<string[]>([]);
  const columnRoles = ref<string[]>([]);
  const startLine = ref(1);
  const activeComponent = ref<string>('');

  const columnRoleOptions = [
    { value: AZColumnRole.DESTINATION, label: 'Destination Name' },
    { value: AZColumnRole.DIALCODE, label: 'Dial Code' },
    { value: AZColumnRole.RATE, label: 'Rate' },
  ];

  async function handleFileInput(event: Event, componentId: string) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      isProcessing[componentId] = true;
      files[componentId] = file;

      // Generate preview
      const preview = await new Promise<{ headers: string[]; data: string[][] }>((resolve, reject) => {
        Papa.parse(file, {
          preview: 5,
          error: error => reject(new Error(`Failed to parse CSV: ${error.message}`)),
          complete: results => {
            resolve({
              headers: results.data[0] as string[],
              data: results.data.slice(1) as string[][],
            });
          },
        });
      });

      previewData.value = preview.data;
      columns.value = preview.headers;
      activeComponent.value = componentId;
      showPreviewModal.value = true;
    } finally {
      isProcessing[componentId] = false;
    }
  }

  async function handleModalConfirm(confirmation: { columnRoles: string[]; startLine: number }) {
    if (!activeComponent.value || !files[activeComponent.value]) return;

    try {
      isUploading[activeComponent.value] = true;
      const file = files[activeComponent.value]!;

      await new Promise<void>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async results => {
            try {
              // Create column mapping using indices
              const columnMapping = {
                destination: columns.value.indexOf(confirmation.columnRoles[0]),
                dialcode: columns.value.indexOf(confirmation.columnRoles[1]),
                rate: columns.value.indexOf(confirmation.columnRoles[2]),
              };

              await service.processFile(file, columnMapping, confirmation.startLine);
              store.addFileUploaded(file.name, file.name);
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          error: error => reject(new Error(`Failed to process CSV: ${error.message}`)),
        });
      });

      showPreviewModal.value = false;
    } finally {
      isUploading[activeComponent.value] = false;
    }
  }

  function handleModalCancel() {
    showPreviewModal.value = false;
    files[activeComponent.value] = null;
    activeComponent.value = '';
  }

  return {
    // State
    files,
    isProcessing,
    isUploading,
    isDragging,
    showPreviewModal,
    previewData,
    columns,
    columnRoles,
    columnRoleOptions,
    startLine,
    activeComponent,
    handleFileInput,
    handleModalConfirm,
    handleModalCancel,
  };
}

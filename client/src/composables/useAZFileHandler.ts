import { ref, reactive } from 'vue';
import { useAzStore } from '@/stores/az-store';
import { AZCSVService } from '@/services/az-csv.service';
import { DBName } from '@/types/app-types';
import { AZColumnRole } from '@/types/az-types';

export function useAZFileHandler() {
  const store = useAzStore();
  const service = new AZCSVService();
  
  const files = reactive<Record<string, File | null>>({});
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

    files[componentId] = file;
    const preview = await service.generatePreview(file);
    previewData.value = preview.data;
    columns.value = preview.headers;
    activeComponent.value = componentId;
    showPreviewModal.value = true;
  }

  async function handleModalConfirm(confirmation: { columnRoles: string[]; startLine: number }) {
    try {
      columnRoles.value = confirmation.columnRoles;
      startLine.value = confirmation.startLine;
      showPreviewModal.value = false;

      if (files[activeComponent.value]) {
        await service.processFile(files[activeComponent.value]!, {
          columnRoles: columnRoles.value,
          startLine: startLine.value,
        });
      }
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  }

  function handleModalCancel() {
    showPreviewModal.value = false;
    files[activeComponent.value] = null;
    activeComponent.value = '';
  }

  return {
    files,
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
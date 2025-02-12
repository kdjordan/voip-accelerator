import { reactive } from 'vue';

interface FileUploadHandlers {
  onFileAccepted: (file: File, componentId: string) => Promise<void>;
}

export function useFileUpload({ onFileAccepted }: FileUploadHandlers) {
  const isDragging = reactive<Record<string, boolean>>({});
  const isProcessing = reactive<Record<string, boolean>>({});
  const isUploading = reactive<Record<string, boolean>>({});

  function handleDragEnter(event: DragEvent, componentId: string) {
    event.preventDefault();
    isDragging[componentId] = true;
  }

  function handleDragLeave(event: DragEvent, componentId: string) {
    event.preventDefault();
    isDragging[componentId] = false;
  }

  async function handleDrop(event: DragEvent, componentId: string) {
    event.preventDefault();
    isDragging[componentId] = false;
    
    if (!isProcessing[componentId] && event.dataTransfer?.files) {
      const file = event.dataTransfer.files[0];
      if (file) {
        setProcessing(componentId, true);
        try {
          await onFileAccepted(file, componentId);
        } finally {
          setProcessing(componentId, false);
        }
      }
    }
  }

  function setProcessing(componentId: string, value: boolean) {
    isProcessing[componentId] = value;
  }

  function setUploading(componentId: string, value: boolean) {
    isUploading[componentId] = value;
  }

  return {
    isDragging,
    isProcessing,
    isUploading,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    setProcessing,
    setUploading,
  };
} 
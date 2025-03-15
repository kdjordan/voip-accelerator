// Define the props and emits
const props = defineProps<{
  componentName: ComponentId;
  disabled?: boolean;
  uploading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'file-selected', file: File): void;
  (e: 'modal-confirm', mappings: Record<string, string>, indeterminateDefinition?: string): void;
}>();

// Update the handleFileSelected function
const handleFileSelected = (file: File) => {
  emit('file-selected', file);
};

// Update the handleModalConfirm function
const handleModalConfirm = (mappings: Record<string, string>, indeterminateDefinition?: string) => {
  emit('modal-confirm', mappings, indeterminateDefinition);
};

// Update the handleDrop function
const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = false;

  if (event.dataTransfer?.files.length) {
    const file = event.dataTransfer.files[0];
    handleFileSelected(file);
  }
};

// Update the handleFileInput function
const handleFileInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    const file = input.files[0];
    handleFileSelected(file);
  }
}; 
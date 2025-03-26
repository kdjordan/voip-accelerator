import { ref, Ref } from 'vue';

interface DragDropOptions {
  /**
   * Optional validation function for files
   */
  fileValidator?: (file: File) => { valid: boolean; errorMessage?: string };
  /**
   * Optional callback when drag enters
   */
  onDragEnterCallback?: () => void;
  /**
   * Optional callback when drag leaves
   */
  onDragLeaveCallback?: () => void;
  /**
   * Optional callback for successful file drop
   */
  onDropCallback?: (file: File) => void;
  /**
   * Optional callback for file validation errors
   */
  onError?: (message: string) => void;
  /**
   * Optional filter for file extensions
   */
  acceptedExtensions?: string[];
}

interface DragDropReturn {
  /**
   * Whether the drag is currently over the drop zone
   */
  isDragging: Ref<boolean>;
  /**
   * Error message from the last validation
   */
  errorMessage: Ref<string | null>;
  /**
   * Handler for dragenter event
   */
  handleDragEnter: (event: DragEvent) => void;
  /**
   * Handler for dragleave event
   */
  handleDragLeave: (event: DragEvent) => void;
  /**
   * Handler for dragover event
   */
  handleDragOver: (event: DragEvent) => void;
  /**
   * Handler for drop event
   */
  handleDrop: (event: DragEvent) => void;
  /**
   * Reset the error message
   */
  clearError: () => void;
}

/**
 * Composable for handling drag and drop file uploads
 */
export function useDragDrop(options: DragDropOptions = {}): DragDropReturn {
  const isDragging = ref(false);
  const errorMessage = ref<string | null>(null);

  // Default file validator checks file extensions
  const defaultValidator = (file: File): { valid: boolean; errorMessage?: string } => {
    // If no accepted extensions are specified, accept all files
    if (!options.acceptedExtensions || options.acceptedExtensions.length === 0) {
      return { valid: true };
    }

    // Check if file extension is in accepted list
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidExtension = options.acceptedExtensions.includes(fileExtension);

    if (!isValidExtension) {
      return {
        valid: false,
        errorMessage: `Only ${options.acceptedExtensions.join(', ')} files are accepted`,
      };
    }

    return { valid: true };
  };

  // Use provided validator or default
  const validateFile = options.fileValidator || defaultValidator;

  // Event handlers
  const handleDragEnter = (event: DragEvent): void => {
    event.preventDefault();
    isDragging.value = true;
    options.onDragEnterCallback?.();
  };

  const handleDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    isDragging.value = false;
    options.onDragLeaveCallback?.();
  };

  const handleDragOver = (event: DragEvent): void => {
    event.preventDefault(); // Required to enable drop
  };

  const handleDrop = (event: DragEvent): void => {
    event.preventDefault();
    isDragging.value = false;

    // Clear previous errors
    errorMessage.value = null;

    // Check if files are being dropped
    if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) {
      return;
    }

    const file = event.dataTransfer.files[0];
    if (!file) return;

    // Validate the file
    const validationResult = validateFile(file);
    if (!validationResult.valid) {
      errorMessage.value = validationResult.errorMessage || 'Invalid file';
      options.onError?.(errorMessage.value);
      return;
    }

    // Call the callback with the valid file
    options.onDropCallback?.(file);
  };

  const clearError = (): void => {
    errorMessage.value = null;
  };

  return {
    isDragging,
    errorMessage,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    clearError,
  };
}

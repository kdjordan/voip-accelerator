import { ref, computed } from 'vue'

export function useUploadState() {
  // UI State
  const isProcessing = ref(false)
  const isDragging = ref(false)
  const dragCounter = ref(0)

  // Computed
  const isDropzoneDisabled = computed(() => isProcessing.value)

  // State changes
  function handleDragEnter() {
    if (!isDropzoneDisabled.value) {
      dragCounter.value++
      isDragging.value = true
    }
  }

  function handleDragLeave() {
    dragCounter.value--
    if (dragCounter.value === 0) {
      isDragging.value = false
    }
  }

  // Add reset function
  function resetState() {
    isProcessing.value = false
    isDragging.value = false
    dragCounter.value = 0
  }

  return {
    // State
    isProcessing,
    isDragging,
    isDropzoneDisabled,
    // Methods
    handleDragEnter,
    handleDragLeave,
    setProcessing: (value: boolean) => {
      isProcessing.value = value
    },
    resetState // Export the reset function
  }
} 
import { ref, computed } from 'vue'
import type { DBNameType } from '@/domains/shared/types'

export type UploadStep = 'idle' | 'uploading' | 'processing' | 'preview' | 'complete'
export type ComponentType = 'owner' | 'carrier' | 'client'

interface UploadStateOptions {
  DBname: DBNameType
  componentName: string
  componentType: ComponentType
}

export function useUploadState(options: UploadStateOptions) {
  const currentStep = ref<UploadStep>('idle')
  const isProcessing = ref(false)
  const isUploading = ref(false)
  const isDragActive = ref(0)
  const showPreview = ref(false)

  // Computed states for UI
  const isDropzoneDisabled = computed(() => 
    isProcessing.value || 
    isUploading.value || 
    currentStep.value === 'complete'
  )

  const uploadState = computed(() => ({
    canUpload: currentStep.value === 'idle',
    showRemoveButton: currentStep.value === 'complete',
    showProgressIndicator: isProcessing.value || isUploading.value,
    dropzoneActive: isDragActive.value > 0 && !isDropzoneDisabled.value,
    componentName: options.componentName,
    componentType: options.componentType,
    DBname: options.DBname
  }))

  function setState(step: UploadStep) {
    currentStep.value = step
  }

  function incrementDragCounter() {
    isDragActive.value++
  }

  function decrementDragCounter() {
    isDragActive.value--
  }

  return {
    currentStep,
    isProcessing,
    isUploading,
    isDragActive,
    showPreview,
    isDropzoneDisabled,
    uploadState,
    setState,
    incrementDragCounter,
    decrementDragCounter,
    setProcessing: (value: boolean) => {
      isProcessing.value = value
      if (!value && currentStep.value === 'processing') {
        setState('idle')
      }
    },
    setUploading: (value: boolean) => {
      isUploading.value = value
      if (!value && currentStep.value === 'uploading') {
        setState('idle')
      }
    },
    setPreview: (value: boolean) => {
      showPreview.value = value
      setState(value ? 'preview' : 'idle')
    }
  }
} 
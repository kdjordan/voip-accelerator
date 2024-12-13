import { computed } from 'vue'
import type { DBNameType, DomainStoreType } from '@/domains/shared/types'
import { useAzStore } from '@/domains/az/store'
import { useNpanxxStore } from '@/domains/npanxx/store'
import { useUploadState } from './useUploadState'
import useCSVProcessing from './useCsvProcessing'
import type { ComponentType } from './useUploadState'

interface UploadHandlerOptions {
  DBname: DBNameType
  componentName: string
  componentType: ComponentType
}

export function useFileUploadHandler(options: UploadHandlerOptions) {
  const uploadState = useUploadState(options)
  const csvProcessing = useCSVProcessing()
  
  const store = computed((): DomainStoreType => {
    switch (options.DBname) {
      case 'az':
        return useAzStore()
      case 'us':
        return useNpanxxStore()
      default:
        throw new Error(`Invalid DBname: ${options.DBname}`)
    }
  })

  async function handleFileInput(file: File) {
    uploadState.setProcessing(true)
    csvProcessing.file.value = file

    try {
      await csvProcessing.parseCSVForPreview(file)
      uploadState.setPreview(true)
    } catch (error) {
      console.error('Error handling file:', error)
    } finally {
      uploadState.setProcessing(false)
    }
  }

  async function handlePreviewConfirm(confirmation: { columnRoles: string[]; startLine: number }) {
    uploadState.setPreview(false)
    uploadState.setProcessing(true)

    try {
      csvProcessing.columnRoles.value = confirmation.columnRoles
      csvProcessing.startLine.value = confirmation.startLine
      await csvProcessing.parseCSVForFullProcessing()
      store.value.addFileUploaded(options.componentName, csvProcessing.file.value?.name || '')
      uploadState.setState('complete')
    } catch (error) {
      console.error('Error processing file:', error)
    } finally {
      uploadState.setProcessing(false)
    }
  }

  async function handleRemoveFile() {
    try {
      await csvProcessing.removeFromDB()
      store.value.removeFile(options.componentName)
      uploadState.setState('idle')
    } catch (error) {
      console.error('Error removing file:', error)
    }
  }

  return {
    ...uploadState,
    handleFileInput,
    handlePreviewConfirm,
    handleRemoveFile,
    isDisabled: computed(() => store.value.isComponentDisabled(options.componentName))
  }
} 
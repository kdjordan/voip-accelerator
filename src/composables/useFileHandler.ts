import { ref } from 'vue'
import type { ColumnRoleOption, DBNameType, StandardizedData } from '@/domains/shared/types'
import useCSVProcessing from './useCsvProcessing'
import useIndexedDB from './useIndexDB'

interface FileHandlerOptions {
  onFileAccepted: (file: File) => Promise<void>
  onFileRemoved: () => void
  DBname: DBNameType
  componentName: string
}

export function useFileHandler(options: FileHandlerOptions) {
  const csvProcessing = useCSVProcessing()
  const { storeInIndexedDB, deleteObjectStore } = useIndexedDB()
  
  // Initialize CSV processing with component info
  csvProcessing.deckType.value = options.DBname
  csvProcessing.DBname.value = options.DBname
  csvProcessing.componentName.value = options.componentName

  async function handleFileInput(event: Event) {
    const target = event.target as HTMLInputElement
    if (!target.files?.length) return

    try {
      csvProcessing.file.value = target.files[0]
      // First process the file for preview
      await csvProcessing.parseCSVForPreview(csvProcessing.file.value)
      // Then call the callback
      await options.onFileAccepted(csvProcessing.file.value)
    } catch (error) {
      console.error('Error handling file input:', error)
    }
  }

  async function handlePreviewConfirm(confirmation: { columnRoles: string[]; startLine: number }) {
    csvProcessing.columnRoles.value = confirmation.columnRoles
    csvProcessing.startLine.value = confirmation.startLine
    csvProcessing.showPreviewModal.value = false
    
    // Process the CSV and store in IndexDB
    const processedData = await csvProcessing.parseCSVForFullProcessing()
    if (processedData) {
      try {
        await storeInIndexedDB(
          processedData,
          options.DBname,
          csvProcessing.file.value?.name || '',
          options.componentName
        )
      } catch (error) {
        console.error('Error storing data:', error)
        throw error
      }
    }
  }

  async function handleRemoveFile() {
    try {
      const storeName = `${options.componentName}-store`
      await deleteObjectStore(options.DBname, storeName)
      csvProcessing.file.value = null
      csvProcessing.showPreviewModal.value = false
      options.onFileRemoved()
    } catch (error) {
      console.error('Error removing file:', error)
      throw error
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
      csvProcessing.showPreviewModal.value = false
      csvProcessing.file.value = null
    },
    handleRemoveFile,
  }
} 
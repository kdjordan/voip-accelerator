<template>
  <div class="flex flex-col gap-8 w-full">
    <!-- Upload Zones Box -->
    <div class="bg-gray-800 rounded-b-lg p-6">
      <div class="pb-4 mb-6">
        <div class="grid grid-cols-2 gap-8">
          <!-- Your Rates Upload Zone -->
          <div class="flex flex-col gap-2">
            <h2 class="text-base text-fbWhite mb-4">Your Rates Here</h2>
            <div
              class="relative border-2 rounded-lg p-8 min-h-[120px] flex items-center justify-center"
              :class="[
                isDragging[component1]
                  ? 'border-accent bg-fbWhite/10'
                  : !usStore.isComponentDisabled(component1)
                  ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600 dashed'
                  : '',
                usStore.isComponentUploading(component1)
                  ? 'animate-upload-pulse cursor-not-allowed'
                  : !usStore.isComponentDisabled(component1)
                  ? 'cursor-pointer'
                  : '',
                usStore.isComponentDisabled(component1)
                  ? 'bg-accent/20 border-2 border-solid border-accent/50'
                  : 'border-fbWhite',
              ]"
            >
              <!-- File Input and Content -->
              <input
                type="file"
                accept=".csv"
                class="absolute inset-0 opacity-0"
                :class="{ 'pointer-events-none': usStore.isComponentDisabled(component1) }"
                :disabled="usStore.isComponentDisabled(component1)"
                @change="e => handleFileInput(e, component1)"
              />

              <div class="flex flex-col h-full">
                <!-- Empty State -->
                <template v-if="!usStore.isComponentDisabled(component1)">
                  <div class="flex-1 flex items-center justify-center">
                    <div class="text-center">
                      <ArrowUpTrayIcon
                        class="w-12 h-12 text-accent mx-auto border border-accent/50 rounded-full p-2 bg-accent/10"
                      />
                      <p class="mt-2 text-base text-foreground text-accent">
                        DRAG & DROP to upload or CLICK to select file
                      </p>
                    </div>
                  </div>
                </template>

                <!-- Uploading State -->
                <template v-if="usStore.isComponentUploading(component1)">
                  <div class="flex-1 flex items-center justify-center">
                    <p class="text-sizeMd text-accent">Processing your file...</p>
                  </div>
                </template>

                <!-- File Uploaded State -->
                <template v-if="usStore.isComponentDisabled(component1)">
                  <div class="flex-1 flex items-center justify-center">
                    <div class="flex items-center space-x-2">
                      <DocumentIcon class="w-5 h-5 text-accent" />
                      <p class="text-sizeLg text-accent">{{ usStore.getFileNameByComponent(component1) }}</p>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- Remove File Button -->
            <button
              v-if="usStore.isComponentDisabled(component1)"
              @click="handleRemoveFile(component1)"
              class="ml-auto px-4 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded-md transition-colors"
            >
              <div class="flex items-center justify-center space-x-2">
                <TrashIcon class="w-3.5 h-3.5 text-red-400" />
                <span class="text-xs text-red-400">Remove</span>
              </div>
            </button>
          </div>

          <!-- Prospect's Rates Upload Zone -->
          <div class="flex flex-col gap-2">
            <h2 class="text-base text-fbWhite mb-4">Prospect's Rates Here</h2>
            <div
              class="relative border-2 rounded-lg p-8 min-h-[120px] flex items-center justify-center"
              :class="[
                isDragging[component2]
                  ? 'border-accent bg-fbWhite/10'
                  : !usStore.isComponentDisabled(component2)
                  ? 'hover:border-accent-hover hover:bg-fbWhite/10 border-2 border-dashed border-gray-600 '
                  : '',
                usStore.isComponentUploading(component2)
                  ? 'animate-upload-pulse cursor-not-allowed'
                  : !usStore.isComponentDisabled(component2)
                  ? 'cursor-pointer'
                  : '',
                usStore.isComponentDisabled(component2)
                  ? 'bg-accent/20 border-2 border-solid border-accent/50'
                  : 'border-fbWhite',
              ]"
            >
              <!-- File Input and Content -->
              <input
                type="file"
                accept=".csv"
                class="absolute inset-0 opacity-0"
                :class="{ 'pointer-events-none': usStore.isComponentDisabled(component2) }"
                :disabled="usStore.isComponentDisabled(component2)"
                @change="e => handleFileInput(e, component2)"
              />

              <div class="flex flex-col h-full">
                <!-- Empty State -->
                <template v-if="!usStore.isComponentDisabled(component2)">
                  <div class="flex-1 flex items-center justify-center">
                    <div class="text-center">
                      <ArrowUpTrayIcon
                        class="w-12 h-12 text-accent mx-auto border border-accent/50 rounded-full p-2 bg-accent/10"
                      />
                      <p class="mt-2 text-base text-foreground text-accent">
                        DRAG & DROP to upload or CLICK to select file
                      </p>
                    </div>
                  </div>
                </template>

                <!-- Uploading State -->
                <template v-if="usStore.isComponentUploading(component2)">
                  <div class="flex-1 flex items-center justify-center">
                    <p class="text-sizeMd text-accent">Processing your file...</p>
                  </div>
                </template>

                <!-- File Uploaded State -->
                <template v-if="usStore.isComponentDisabled(component2)">
                  <div class="flex-1 flex items-center justify-center">
                    <div class="flex items-center space-x-2">
                      <DocumentIcon class="w-5 h-5 text-accent" />
                      <p class="text-sizeLg text-accent">{{ usStore.getFileNameByComponent(component2) }}</p>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- Remove File Button -->
            <button
              v-if="usStore.isComponentDisabled(component2)"
              @click="handleRemoveFile(component2)"
              class="ml-auto px-4 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/50 rounded-md transition-colors"
            >
              <div class="flex items-center justify-center space-x-2">
                <TrashIcon class="w-3.5 h-3.5 text-red-400" />
                <span class="text-xs text-red-400">Remove</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Reports Button -->
      <div class="border-t border-gray-700/50">
        <div class="flex justify-end mt-8">
          <button
            v-if="!usStore.reportsGenerated"
            @click="handleReportsAction"
            :disabled="!usStore.isFull || isGeneratingReports"
            class="px-6 py-2 bg-accent/20 border border-accent/50 hover:bg-accent/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:border disabled:border-gray-700"
            :class="{ 'animate-pulse': isGeneratingReports }"
          >
            <div class="flex items-center justify-center space-x-2">
              <ArrowRightIcon class="w-4 h-4 text-accent" />
              <span class="text-sm text-accent">{{ isGeneratingReports ? 'GENERATING REPORTS' : 'Get Reports' }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <PreviewModal2
      v-if="showPreviewModal"
      :showModal="showPreviewModal"
      :columns="columns"
      :preview-data="previewData"
      :start-line="startLine"
      :column-options="US_COLUMN_ROLE_OPTIONS"
      @update:mappings="handleMappingUpdate"
      @update:valid="isValid => (isModalValid = isValid)"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue';
  import { ArrowUpTrayIcon, DocumentIcon, TrashIcon, ArrowRightIcon } from '@heroicons/vue/24/outline';
  import PreviewModal2 from '@/components/shared/PreviewModal2.vue';
  import { useUsStore } from '@/stores/us-store';
  import { DBName } from '@/types/app-types';
  import useDexieDB from '@/composables/useDexieDB';
  import { USColumnRole, US_COLUMN_ROLE_OPTIONS } from '@/types/domains/us-types';
  import Papa from 'papaparse';
  // import { USService } from '@/services/us.service';

  const usStore = useUsStore();
  const { loadFromDexieDB } = useDexieDB();

  // Component state
  const component1 = ref<string>('us1');
  const component2 = ref<string>('us2');
  const isGeneratingReports = ref<boolean>(false);
  const isDragging = reactive<Record<string, boolean>>({});
  const showPreviewModal = ref(false);
  const isModalValid = ref(false);
  const columnMappings = ref<Record<string, string>>({});

  // Preview state
  const previewData = ref<string[][]>([]);
  const columns = ref<string[]>([]);
  const startLine = ref(1);
  const activeComponent = ref<string>('');

  // const usService = new USService();

  async function handleFileUploaded(componentName: string, fileName: string) {
    usStore.addFileUploaded(componentName, fileName);
    console.log(`File uploaded for ${componentName}: ${fileName}`);
  }

  async function handleReportsAction() {
    if (usStore.reportsGenerated) {
      usStore.showUploadComponents = false;
    } else {
      await generateReports();
    }
  }

  async function generateReports() {
    isGeneratingReports.value = true;
    // try {
    //   const fileNames = usStore.getFileNames;
    //   const file1Data = await loadFromDexieDB(DBName.US, fileNames[0]);
    //   const file2Data = await loadFromDexieDB(DBName.US, fileNames[1]);

    //   if (file1Data && file2Data) {
    //     const { pricing, code } = await makeNpanxxReportsApi({
    //       fileName1: fileNames[0].split('.')[0],
    //       fileName2: fileNames[1].split('.')[0],
    //       file1Data: file1Data as USStandardizedData[],
    //       file2Data: file2Data as USStandardizedData[],
    //     });

    //     if (pricing && code) {
    //       usStore.setReports(pricing, code);
    //     }
    //   }
    // } catch (error) {
    //   console.error('Error generating reports:', error);
    // } finally {
    //   isGeneratingReports.value = false;
    // }
  }

  // File handling functions
  async function handleFileInput(event: Event, componentId: string) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    usStore.setTempFile(componentId, file);

    Papa.parse(file, {
      preview: 5,
      complete: results => {
        previewData.value = results.data.slice(1) as string[][];
        columns.value = results.data[0] as string[];
        activeComponent.value = componentId;
        showPreviewModal.value = true;
      },
      error: error => {
        console.error('Error parsing CSV:', error);
        usStore.clearTempFile(componentId);
      },
    });
  }

  // Modal handlers
  function handleMappingUpdate(newMappings: Record<string, string>) {
    columnMappings.value = newMappings;
  }

  async function handleModalConfirm(mappings: Record<string, string>) {
    const file = usStore.getTempFile(activeComponent.value);
    if (!file) return;

    showPreviewModal.value = false;
    usStore.setComponentUploading(activeComponent.value, true);

    try {
      // Convert mappings to column indices
      const columnMapping = {
        npanxx: Number(Object.entries(mappings).find(([_, value]) => value === USColumnRole.NPANXX)?.[0] ?? -1),
        npa: Number(Object.entries(mappings).find(([_, value]) => value === USColumnRole.NPA)?.[0] ?? -1),
        nxx: Number(Object.entries(mappings).find(([_, value]) => value === USColumnRole.NXX)?.[0] ?? -1),
        interstate: Number(Object.entries(mappings).find(([_, value]) => value === USColumnRole.INTERSTATE)?.[0] ?? -1),
        intrastate: Number(Object.entries(mappings).find(([_, value]) => value === USColumnRole.INTRASTATE)?.[0] ?? -1),
        indeterminate: Number(
          Object.entries(mappings).find(([_, value]) => value === USColumnRole.INDETERMINATE)?.[0] ?? -1
        ),
      };

      // Process file with mappings
      // const result = await usService.processFile(file, columnMapping, startLine.value);
      // await handleFileUploaded(activeComponent.value, result.fileName);
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      usStore.setComponentUploading(activeComponent.value, false);
      usStore.clearTempFile(activeComponent.value);
    }
  }

  function handleModalCancel() {
    showPreviewModal.value = false;
    usStore.clearTempFile(activeComponent.value);
    activeComponent.value = '';
  }

  async function handleRemoveFile(componentName: string) {
    try {
      const fileName = usStore.getFileNameByComponent(componentName);
      if (!fileName) return;

      const tableName = fileName.toLowerCase().replace('.csv', '');
      // await usService.removeTable(tableName);
      usStore.removeFile(componentName);
    } catch (error) {
      console.error('Error removing file:', error);
    }
  }
</script>

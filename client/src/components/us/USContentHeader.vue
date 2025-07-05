<template>
  <div class="w-full">
    <!-- Report Type Tabs -->
    <div class="bg-gray-800 px-6 pb-6 rounded-t-lg">
      <div class="flex items-center border-b border-gray-700">
        <ReportTabButton
          v-for="type in availableReportTypes"
          :key="type"
          :label="getReportLabel(type)"
          :is-active="usStore.activeReportType === type"
          :is-loading="type === 'pricing' && usStore.isPricingReportProcessing"
          @click="usStore.setActiveReportType(type)"
        />

        <div class="ml-auto flex items-center space-x-2">
          <BaseButton
            v-if="usStore.filesUploaded.size === 2"
            variant="destructive"
            size="small"
            @click="showResetConfirmModal = true"
            :is-loading="isResetting"
          >
            Reset
          </BaseButton>
        </div>
      </div>
    </div>
  </div>

  <!-- Reset Confirmation Modal -->
  <ConfirmationModal
    v-model="showResetConfirmModal"
    title="Reset All US Rate Sheet Data"
    :message="`This will permanently delete all uploaded rate sheet data, analysis reports, and database records.

This action cannot be undone.`"
    confirm-button-text="Reset All Data"
    cancel-button-text="Cancel"
    :loading="isResetting"
    @confirm="confirmReset"
  />
</template>

<script setup lang="ts">
  import { useUsStore } from '@/stores/us-store';
  import { ReportTypes, type ReportType } from '@/types/app-types';
  import useDexieDB from '@/composables/useDexieDB';
  import { DBName } from '@/types';
  import { computed, watch, ref } from 'vue';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import ReportTabButton from '@/components/shared/ReportsTabButton.vue';
  import ConfirmationModal from '@/components/shared/ConfirmationModal.vue';

  const usStore = useUsStore();
  const { deleteDatabase } = useDexieDB();
  const isResetting = ref(false);
  const showResetConfirmModal = ref(false);

  // Compute available report types based on the new readiness flags
  const availableReportTypes = computed(() => {
    const types: ReportType[] = [ReportTypes.FILES]; // Files always available
    if (usStore.isCodeReportReady) {
      types.push(ReportTypes.CODE);
    }
    // Show Pricing tab when ready OR when processing (to show spinner)
    if (usStore.isPricingReportReady || usStore.isPricingReportProcessing) {
      types.push(ReportTypes.PRICING);
    }
    return types;
  });

  // Watch for code report readiness and switch tab only from Files tab
  watch(
    () => usStore.isCodeReportReady,
    (isReady) => {
      if (isReady && usStore.activeReportType === ReportTypes.FILES) {
        console.log('[USContentHeader] Code report ready, switching from Files to Code tab.');
        usStore.setActiveReportType(ReportTypes.CODE);
      }
    }
  );

  // Helper function to get the correct report label
  function getReportLabel(type: ReportType): string {
    if (type === ReportTypes.CODE) {
      return 'Code Compare';
    }
    if (type === ReportTypes.PRICING) {
      return 'Pricing Report';
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  async function confirmReset() {
    isResetting.value = true;
    try {
      console.log('Resetting the US report');

      // Reset store state first
      usStore.resetFiles();

      console.log(`Attempting to delete Dexie database: ${DBName.US}`);
      await deleteDatabase(DBName.US)
        .then(() => console.log(`Successfully deleted database: ${DBName.US}`))
        .catch((err) => console.error(`Failed to delete database ${DBName.US}:`, err));

      console.log(`Attempting to delete Dexie database: ${DBName.US_PRICING_COMPARISON}`);
      await deleteDatabase(DBName.US_PRICING_COMPARISON)
        .then(() => console.log(`Successfully deleted database: ${DBName.US_PRICING_COMPARISON}`))
        .catch((err) =>
          console.error(`Failed to delete database ${DBName.US_PRICING_COMPARISON}:`, err)
        );

      console.log('Reset completed successfully');
      showResetConfirmModal.value = false;
    } catch (error) {
      console.error('Error during reset:', error);
    } finally {
      isResetting.value = false;
    }
  }
</script>

<template>
  <div class="bg-gray-900/50 p-4 rounded-lg mb-4">
    <div class="bg-gray-900/30 p-2 rounded-t-md">
      <div class="flex items-center gap-2 w-full justify-between">
        <h3 class="text-sm font-medium text-gray-300">Effective Date Settings</h3>
      </div>
    </div>

    <div class="mt-4">
      <div class="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-400">SAME Rate</span>
          </div>
          <input
            type="date"
            v-model="effectiveDateSettings.sameCustomDate"
            @change="setSameDate('custom')"
            class="w-full bg-gray-800 border border-gray-700 rounded text-sm px-3 py-2"
            :class="effectiveDateSettings.same === 'custom' ? 'text-white' : 'text-gray-400'"
          />
        </div>
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-400">DECREASE Rate</span>
          </div>
          <input
            type="date"
            v-model="effectiveDateSettings.decreaseCustomDate"
            @change="setDecreaseDate('custom')"
            class="w-full bg-gray-800 border border-gray-700 rounded text-sm px-3 py-2"
            :class="effectiveDateSettings.decrease === 'custom' ? 'text-white' : 'text-gray-400'"
          />
        </div>
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-400">INCREASE Rate</span>
          </div>
          <input
            type="date"
            v-model="effectiveDateSettings.increaseCustomDate"
            @change="setIncreaseDate('custom')"
            class="w-full bg-gray-800 border border-gray-700 rounded text-sm px-3 py-2"
            :class="effectiveDateSettings.increase === 'custom' ? 'text-white' : 'text-gray-400'"
          />
        </div>
      </div>

      <div class="space-y-4">
        <div v-if="isApplyingSettings" class="mb-4">
          <div class="text-sm text-gray-300 mb-2">{{ processingStatus }}</div>
          <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              class="h-2 rounded-full bg-accent transition-all duration-300"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
        </div>

        <div class="flex justify-end w-full">
          <BaseButton
            variant="primary"
            size="small"
            :loading="isApplyingSettings"
            :disabled="!hasDateSettingsChanged || store.getDiscrepancyCount > 0"
            :icon="ArrowRightIcon"
            @click="applyEffectiveDateSettings"
            title="Apply effective date settings to all records (resolve conflicts first if any)"
          >
            Apply
          </BaseButton>
        </div>
      </div>
      <div v-if="store.getDiscrepancyCount > 0" class="mt-2 text-xs text-warning">
        Please resolve all {{ store.getDiscrepancyCount }} rate conflict(s) before applying date
        settings.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import { useAzRateSheetStore } from '@/stores/az-rate-sheet-store';
  import EffectiveDateUpdaterWorker from '@/workers/effective-date-updater.worker?worker';
  import type { EffectiveDateSettings, ChangeCodeType } from '@/types/domains/rate-sheet-types';
  import { ChangeCode } from '@/types/domains/rate-sheet-types';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import { ArrowRightIcon } from '@heroicons/vue/24/outline';

  const store = useAzRateSheetStore();

  const effectiveDateSettings = ref<EffectiveDateSettings>({
    same: 'today',
    increase: 'week',
    decrease: 'today',
    sameCustomDate: new Date().toISOString().split('T')[0],
    increaseCustomDate: (() => {
      const sevenDays = new Date();
      sevenDays.setDate(sevenDays.getDate() + 7);
      return sevenDays.toISOString().split('T')[0];
    })(),
    decreaseCustomDate: new Date().toISOString().split('T')[0],
  });

  const isApplyingSettings = ref(false);
  const processingPhase = ref<'idle' | 'preparing' | 'processing' | 'updating' | 'finalizing'>(
    'idle'
  );
  const processingStatus = ref('');
  const processingStartTime = ref(0);
  const progressPercentage = ref(0);
  const processingLogs = ref<{ time: number; message: string }[]>([]);

  let effectiveDateWorker: Worker | null = null;
  const lastUIUpdateTime = ref(0);
  const uiUpdateThrottle = 50;
  const pendingUIUpdates = ref<any>({}); // Simplified for this component

  const hasDateSettingsChanged = computed(() => {
    const savedStoreSettings = store.getEffectiveDateSettings;

    // Helper to get initial component default custom date for a given mode type
    function getInitialComponentCustomDateDefault(type: 'same' | 'decrease' | 'increase'): string {
      if (type === 'increase') {
        const sevenDays = new Date();
        sevenDays.setDate(sevenDays.getDate() + 7);
        return sevenDays.toISOString().split('T')[0];
      }
      return new Date().toISOString().split('T')[0]; // Default to today for 'same' and 'decrease'
    }

    // Helper to get initial component default mode
    function getInitialComponentModeDefault(type: 'same' | 'decrease' | 'increase'): string {
      if (type === 'increase') return 'week';
      return 'today'; // Default to 'today' for 'same' and 'decrease'
    }

    if (!savedStoreSettings) {
      // No settings in store (first load, nothing applied yet).
      // Compare current UI state against initial component defaults.
      if (
        effectiveDateSettings.value.sameCustomDate !== getInitialComponentCustomDateDefault('same')
      )
        return true;
      if (
        effectiveDateSettings.value.decreaseCustomDate !==
        getInitialComponentCustomDateDefault('decrease')
      )
        return true;
      if (
        effectiveDateSettings.value.increaseCustomDate !==
        getInitialComponentCustomDateDefault('increase')
      )
        return true;

      if (effectiveDateSettings.value.same !== getInitialComponentModeDefault('same')) return true;
      if (effectiveDateSettings.value.decrease !== getInitialComponentModeDefault('decrease'))
        return true;
      if (effectiveDateSettings.value.increase !== getInitialComponentModeDefault('increase'))
        return true;

      return false; // No changes from initial component defaults
    }

    // Store settings exist. Compare current UI state with the last saved settings from the store.
    if (effectiveDateSettings.value.sameCustomDate !== savedStoreSettings.sameCustomDate)
      return true;
    if (effectiveDateSettings.value.decreaseCustomDate !== savedStoreSettings.decreaseCustomDate)
      return true;
    if (effectiveDateSettings.value.increaseCustomDate !== savedStoreSettings.increaseCustomDate)
      return true;

    // Compare modes as well, because picking a date sets the mode to 'custom'.
    if (effectiveDateSettings.value.same !== savedStoreSettings.same) return true;
    if (effectiveDateSettings.value.decrease !== savedStoreSettings.decrease) return true;
    if (effectiveDateSettings.value.increase !== savedStoreSettings.increase) return true;

    return false; // Current UI matches the last saved settings in the store
  });

  function setSameDate(value: 'today' | 'tomorrow' | 'custom') {
    effectiveDateSettings.value.same = value;
    if (value === 'today') {
      effectiveDateSettings.value.sameCustomDate = new Date().toISOString().split('T')[0];
    } else if (value === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      effectiveDateSettings.value.sameCustomDate = tomorrow.toISOString().split('T')[0];
    }
  }

  function setIncreaseDate(value: 'today' | 'tomorrow' | 'week' | 'custom') {
    effectiveDateSettings.value.increase = value;
    if (value === 'today') {
      effectiveDateSettings.value.increaseCustomDate = new Date().toISOString().split('T')[0];
    } else if (value === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      effectiveDateSettings.value.increaseCustomDate = tomorrow.toISOString().split('T')[0];
    } else if (value === 'week') {
      const sevenDays = new Date();
      sevenDays.setDate(sevenDays.getDate() + 7);
      effectiveDateSettings.value.increaseCustomDate = sevenDays.toISOString().split('T')[0];
    }
  }

  function setDecreaseDate(value: 'today' | 'tomorrow' | 'custom') {
    effectiveDateSettings.value.decrease = value;
    if (value === 'today') {
      effectiveDateSettings.value.decreaseCustomDate = new Date().toISOString().split('T')[0];
    } else if (value === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      effectiveDateSettings.value.decreaseCustomDate = tomorrow.toISOString().split('T')[0];
    }
  }

  function initWorker() {
    if (effectiveDateWorker) {
      effectiveDateWorker.terminate();
      effectiveDateWorker = null;
    }
    try {
      effectiveDateWorker = new EffectiveDateUpdaterWorker();
      effectiveDateWorker.onmessage = (event) => {
        const message = event.data;
        queueUIUpdate(message);
      };
      effectiveDateWorker.onerror = (error) => {
        processingStatus.value = `Worker error: ${error.message}`;
        isApplyingSettings.value = false;
        processingPhase.value = 'idle';
      };
    } catch (error) {
      effectiveDateWorker = null;
    }
  }

  function queueUIUpdate(message: any) {
    if ('type' in message && message.type === 'progress') {
      pendingUIUpdates.value.progress = message;
    } else if ('type' in message && message.type === 'error') {
      pendingUIUpdates.value.error = message;
      applyUIUpdates();
    } else {
      pendingUIUpdates.value.result = message;
    }

    const now = Date.now();
    if (now - lastUIUpdateTime.value >= uiUpdateThrottle) {
      applyUIUpdates();
    } else {
      if (!pendingUIUpdates.value.scheduled) {
        pendingUIUpdates.value.scheduled = true;
        setTimeout(() => {
          requestAnimationFrame(() => {
            applyUIUpdates();
          });
        }, uiUpdateThrottle);
      }
    }
  }

  function applyUIUpdates() {
    const updates = pendingUIUpdates.value;
    pendingUIUpdates.value = {};
    lastUIUpdateTime.value = Date.now();

    if (updates.error) {
      processingStatus.value = `Error: ${updates.error.message}`;
      isApplyingSettings.value = false;
      processingPhase.value = 'idle';
      return;
    }

    if (updates.progress) {
      const message = updates.progress;
      progressPercentage.value = message.percentage;
      if (processingPhase.value !== message.phase) {
        processingPhase.value = message.phase;
      }
      if (message.detail) {
        processingStatus.value = message.detail;
      }
    }

    if (updates.result) {
      processingPhase.value = 'updating';
      processingStatus.value = 'Processing complete. Updating store...';
      queueMicrotask(() => {
        const { updatedRecords, recordsUpdatedCount, updatedGroupedData } = updates.result;
        handleWorkerResultWithBreathing(updatedRecords, recordsUpdatedCount, updatedGroupedData);
      });
    }
  }

  async function handleWorkerResultWithBreathing(
    updatedRecords: { name: string; prefix: string; effective: string }[],
    recordsUpdatedCount: number,
    updatedGroupedData: {
      destinationName: string;
      effectiveDate: string;
      changeCode: ChangeCodeType;
    }[]
  ) {
    try {
      processingStatus.value = `Saving ${updatedRecords.length} updated records to store...`;
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 50);
        });
      });

      if (updatedRecords.length > 0) {
        processingPhase.value = 'updating';
        processingStatus.value = 'Updating application state...';
        store.updateEffectiveDatesWithRecords(updatedRecords);
        if (updatedGroupedData && updatedGroupedData.length > 0) {
          store.updateGroupedDataEffectiveDates(updatedGroupedData);
        }
        store.setEffectiveDateSettings({ ...effectiveDateSettings.value });
        const processingTime = Math.floor((Date.now() - processingStartTime.value) / 1000);
        processingStatus.value = `Complete! ${recordsUpdatedCount} records updated in ${processingTime}s`;
        processingPhase.value = 'finalizing';
        await new Promise((resolve) => setTimeout(resolve, 300));
      } else {
        processingPhase.value = 'finalizing';
        processingStatus.value = 'Saving settings...';
        store.setEffectiveDateSettings({ ...effectiveDateSettings.value });
        const processingTime = Math.floor((Date.now() - processingStartTime.value) / 1000);
        processingStatus.value = `Complete! Settings saved in ${processingTime}s`;
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } catch (error) {
      processingStatus.value = `Error: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      isApplyingSettings.value = false;
      progressPercentage.value = 0;
      processingPhase.value = 'idle';
    }
  }

  async function applyEffectiveDateSettings() {
    if (isApplyingSettings.value || !effectiveDateWorker) return;
    if (store.getDiscrepancyCount > 0) {
      alert(
        `Cannot apply effective dates while ${store.getDiscrepancyCount} rate conflicts exist. Please resolve all conflicts first.`
      );
      return;
    }

    isApplyingSettings.value = true;
    progressPercentage.value = 0;
    processingPhase.value = 'preparing';
    processingStatus.value = 'Initializing worker...';
    processingStartTime.value = Date.now();

    try {
      const rawGroupedData = store.groupedData.map((group) => ({
        destinationName: group.destinationName,
        changeCode: group.changeCode,
        effectiveDate: group.effectiveDate,
      }));
      const simplifiedRecords = store.originalData.map((record) => ({
        name: record.name,
        prefix: record.prefix,
        effective: record.effective,
      }));
      processingStatus.value = 'Sending data to worker...';

      // --- BEGIN DEBUG LOGGING ---
      const debugDestinationName = 'Afghanistan- Fixed - Other';
      const problemGroupData = rawGroupedData.find(
        (g) => g.destinationName === debugDestinationName
      );
      console.log(
        `[AZEffectiveDates] Preparing to send to worker. rawGroupedData for "${debugDestinationName}":`,
        JSON.stringify(problemGroupData)
      );
      console.log(
        `[AZEffectiveDates] Full rawGroupedData sample (first 5):`,
        JSON.stringify(rawGroupedData.slice(0, 5))
      );
      console.log(
        `[AZEffectiveDates] Current effectiveDateSettings being sent:`,
        JSON.stringify(effectiveDateSettings.value)
      );
      // --- END DEBUG LOGGING ---

      effectiveDateWorker.postMessage({
        rawGroupedData,
        allRecords: simplifiedRecords,
        effectiveDateSettings: { ...effectiveDateSettings.value },
      });
    } catch (error) {
      processingStatus.value = `Error starting update: ${error instanceof Error ? error.message : String(error)}`;
      isApplyingSettings.value = false;
      processingPhase.value = 'idle';
    }
  }

  onMounted(() => {
    const savedSettings = store.getEffectiveDateSettings;
    if (savedSettings) {
      effectiveDateSettings.value = {
        same: savedSettings.same as 'today' | 'tomorrow' | 'custom',
        increase: savedSettings.increase as 'today' | 'tomorrow' | 'week' | 'custom',
        decrease: savedSettings.decrease as 'today' | 'tomorrow' | 'custom',
        sameCustomDate: savedSettings.sameCustomDate,
        increaseCustomDate: savedSettings.increaseCustomDate,
        decreaseCustomDate: savedSettings.decreaseCustomDate,
      };
      if (effectiveDateSettings.value.increase === 'week') {
        const sevenDaysDate = new Date();
        sevenDaysDate.setDate(sevenDaysDate.getDate() + 7);
        effectiveDateSettings.value.increaseCustomDate = sevenDaysDate.toISOString().split('T')[0];
      }
    }
    initWorker();
  });

  onBeforeUnmount(() => {
    if (effectiveDateWorker) {
      effectiveDateWorker.terminate();
      effectiveDateWorker = null;
    }
  });
</script>

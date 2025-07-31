<template>
  <div class="w-full">
    <!-- Tab Navigation -->
    <div class="bg-gray-800 px-6 pb-6 rounded-t-lg">
      <div class="flex items-center border-b border-gray-700">
        <!-- Upload Files Tab (Always visible) -->
        <ReportTabButton
          label="Upload Files"
          :is-active="activeTab === 'upload'"
          @click="$emit('tab-change', 'upload')"
        />
        
        <!-- Settings Tab (Visible when 2+ files uploaded) -->
        <ReportTabButton
          v-if="store.providerCount >= 2"
          label="Settings"
          :is-active="activeTab === 'settings'"
          @click="$emit('tab-change', 'settings')"
        />
        
        <!-- Generated Rates Tab (Only visible when there are generated decks) -->
        <ReportTabButton
          v-if="store.hasGeneratedDecks"
          label="Generated Rates"
          :is-active="activeTab === 'results'"
          @click="$emit('tab-change', 'results')"
        />

        <!-- Right side actions -->
        <div class="ml-auto flex items-center space-x-2">
          <!-- Clear Providers Button -->
          <BaseButton
            v-if="store.providerCount > 0"
            variant="destructive"
            size="small"
            @click="showResetConfirmModal = true"
            :is-loading="isResetting"
          >
            Clear Providers
          </BaseButton>
        </div>
      </div>
    </div>
  </div>

  <!-- Reset Confirmation Modal -->
  <ConfirmationModal
    v-model="showResetConfirmModal"
    title="Clear Provider Data"
    :message="`This will permanently delete all uploaded provider rate decks.

Your generated rate decks will be preserved.

This action cannot be undone.`"
    confirm-button-text="Clear Provider Data"
    cancel-button-text="Cancel"
    :loading="isResetting"
    @confirm="confirmReset"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRateGenStore } from '@/stores/rate-gen-store';
import { RateGenService } from '@/services/rate-gen.service';
import BaseButton from '@/components/shared/BaseButton.vue';
import ReportTabButton from '@/components/shared/ReportsTabButton.vue';
import ConfirmationModal from '@/components/shared/ConfirmationModal.vue';

// Props
const props = defineProps<{
  activeTab: 'upload' | 'settings' | 'results';
}>();

// Emits
const emit = defineEmits<{
  'tab-change': [tab: 'upload' | 'settings' | 'results'];
}>();

// Store and service
const store = useRateGenStore();
const service = new RateGenService();

// State
const isResetting = ref(false);
const showResetConfirmModal = ref(false);


// Removed automatic tab switching - let users control navigation

// Watch for generation completion and auto-switch to results
watch(
  () => store.generatedDeck,
  (generatedDeck) => {
    if (generatedDeck && props.activeTab === 'settings') {
      console.log('[RateGenHeader] Rate generation complete, switching to Results tab');
      emit('tab-change', 'results');
    }
  }
);

// Methods
async function confirmReset() {
  isResetting.value = true;
  try {
    console.log('[RateGenHeader] Clearing provider data only');
    
    // Clear only provider data, keep generated decks
    await service.clearProvidersOnly();
    
    // Return to upload tab
    emit('tab-change', 'upload');
    
    console.log('[RateGenHeader] Provider data cleared successfully');
    showResetConfirmModal.value = false;
  } catch (error) {
    console.error('[RateGenHeader] Error during reset:', error);
  } finally {
    isResetting.value = false;
  }
}
</script>
<template>
  <transition
    enter-active-class="ease-out duration-300"
    enter-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="ease-in duration-200"
    leave-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="props.showModal"
      class="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
    >
      <div class="flex min-h-screen items-center justify-center">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/80" @click="closeModal"></div>

        <!-- Modal Content -->
        <div
          class="relative transform rounded-lg bg-gray-800 text-left shadow-xl transition-all m-4 w-full max-w-2xl max-h-[90vh] flex flex-col"
        >
          <!-- Modal Header -->
          <div
            class="flex items-center justify-between px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-fbWhite/10"
          >
            <h2
              id="info-modal-title"
              class="text-lg leading-6 font-medium text-fbWhite text-secondary uppercase tracking-wider"
            >
              {{ title }}
            </h2>
            <BaseButton
              variant="secondary-outline"
              size="small"
              :icon="XCircleIcon"
              @click="closeModal"
              aria-label="Close modal"
            />
          </div>

          <!-- Modal Body -->
          <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 text-fbWhite overflow-auto">
            <p class="text-base" v-html="message"></p>
          </div>

          <!-- Modal Footer -->
          <div
            class="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse items-center gap-4 bg-fbHover/30 border-t border-fbWhite/10"
          >
            <BaseButton size="standard" variant="secondary" @click="closeModal"> Close </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { XCircleIcon } from '@heroicons/vue/24/outline';
import BaseButton from '@/components/shared/BaseButton.vue';
import type { InfoModalType } from '@/types/ui-types'; // Assuming types are in ui-types

interface InfoModalProps {
  showModal: boolean;
  type: InfoModalType;
}

const props = defineProps<InfoModalProps>();
const emit = defineEmits(['close']);

const message = ref('');
const title = ref('');

// Function to set the message and title based on type
function setContentByType(type: InfoModalType) {
  switch (type) {
    case 'us_rate_sheet':
      title.value = 'US Rate Sheet Instructions';
      message.value =
        'This wizard helps you upload and manage <strong>US Rate Sheet</strong> data. <br>Drag & drop or click to upload a CSV file containing: <ol><li><code class="bg-gray-700 px-1 rounded text-accent text-sm">NPANXX</code> (or <code class="bg-gray-700 px-1 rounded text-accent text-sm">NPA</code> + <code class="bg-gray-700 px-1 rounded text-accent text-sm">NXX</code>)</li><li><code class="bg-gray-700 px-1 rounded text-accent text-sm">Interstate Rate</code></li><li><code class="bg-gray-700 px-1 rounded text-accent text-sm">Intrastate Rate</code></li></ol>The tool will guide you through column mapping and processing. <br>All data is stored locally in your browser.';
      break;
    case 'az_rate_deck':
      title.value = 'A-Z Rate Deck Info';
      message.value =
        'Upload <strong>A-Z rate decks</strong> here. Ensure the CSV has columns for <code class="bg-gray-700 px-1 rounded text-accent text-sm">Dial Code</code>, <code class="bg-gray-700 px-1 rounded text-accent text-sm">Country Name</code>, and <code class="bg-gray-700 px-1 rounded text-accent text-sm">Rate</code>. The system will process the file and store the data locally.';
      break;
    case 'us_rate_deck':
      title.value = 'US Rate Deck Info';
      message.value =
        'Upload <strong>US rate decks</strong> (CSV format) containing <code class="bg-gray-700 px-1 rounded text-accent text-sm">OCN</code>, <code class="bg-gray-700 px-1 rounded text-accent text-sm">State</code>, <code class="bg-gray-700 px-1 rounded text-accent text-sm">Tier</code>, and <code class="bg-gray-700 px-1 rounded text-accent text-sm">Rate</code> information. Map the columns correctly during the preview step.';
      break;
    // Add cases for other types here as needed
    default:
      // Exhaustive check helper - uncomment if you have one
      // const _exhaustiveCheck: never = type;
      console.warn('Unhandled InfoModal type:', type);
      title.value = 'Information';
      message.value = 'General information details.';
  }
}

// Watch for changes in props to update the message and title
watch(
  () => props.type,
  (newType) => {
    setContentByType(newType);
  },
  { immediate: true } // Set content immediately on component mount/prop availability
);

watch(
  () => props.showModal,
  (newValue) => {
    // Optional: Add logic when modal opens/closes, e.g., focus management
  }
);

function closeModal() {
  emit('close');
}
</script>

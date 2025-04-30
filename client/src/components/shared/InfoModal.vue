<template>
  <div
    v-if="props.showModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-opacity duration-300 ease-in-out"
    @click.self="closeModal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="info-modal-title"
  >
    <div
      class="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 transform transition-all duration-300 ease-in-out"
      :class="props.showModal ? 'opacity-100 scale-100' : 'opacity-0 scale-95'"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 id="info-modal-title" class="text-xl font-semibold text-white">Information</h2>
        <button
          @click="closeModal"
          class="text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 text-gray-300">
        <p class="text-base" v-html="message"></p>
      </div>

      <!-- Modal Footer -->
      <div class="flex justify-end p-4 border-t border-gray-700">
        <button
          @click="closeModal"
          class="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import type { InfoModalType } from '@/types/ui-types'; // Assuming types are in ui-types

interface InfoModalProps {
  showModal: boolean;
  type: InfoModalType;
}

const props = defineProps<InfoModalProps>();
const emit = defineEmits(['close']);

const message = ref('');

// Function to set the message based on type
function setMessageByType(type: InfoModalType) {
  switch (type) {
    case 'us_rate_sheet':
      message.value =
        'This wizard helps you upload and manage <strong>US Rate Sheet</strong> data. Drag & drop or click to upload a CSV file containing <code class="bg-gray-700 px-1 rounded text-accent text-sm">NPANXX</code> (or <code class="bg-gray-700 px-1 rounded text-accent text-sm">NPA</code> + <code class="bg-gray-700 px-1 rounded text-accent text-sm">NXX</code>), <code class="bg-gray-700 px-1 rounded text-accent text-sm">Interstate Rate</code>, and <code class="bg-gray-700 px-1 rounded text-accent text-sm">Intrastate Rate</code> columns. The tool will guide you through column mapping and processing. The data is stored locally in your browser.';
      break;
    case 'az_rate_deck':
      message.value =
        'Upload <strong>A-Z rate decks</strong> here. Ensure the CSV has columns for <code class="bg-gray-700 px-1 rounded text-accent text-sm">Dial Code</code>, <code class="bg-gray-700 px-1 rounded text-accent text-sm">Country Name</code>, and <code class="bg-gray-700 px-1 rounded text-accent text-sm">Rate</code>. The system will process the file and store the data locally.';
      break;
    case 'us_rate_deck':
      message.value =
        'Upload <strong>US rate decks</strong> (CSV format) containing <code class="bg-gray-700 px-1 rounded text-accent text-sm">OCN</code>, <code class="bg-gray-700 px-1 rounded text-accent text-sm">State</code>, <code class="bg-gray-700 px-1 rounded text-accent text-sm">Tier</code>, and <code class="bg-gray-700 px-1 rounded text-accent text-sm">Rate</code> information. Map the columns correctly during the preview step.';
      break;
    // Add cases for other types here as needed
    default:
      // Exhaustive check helper - uncomment if you have one
      // const _exhaustiveCheck: never = type;
      console.warn('Unhandled InfoModal type:', type);
      message.value = 'General information details.';
  }
}

// Watch for changes in props to update the message
// This is useful if the modal instance is reused with different types
watch(
  () => props.type,
  (newType) => {
    setMessageByType(newType);
  },
  { immediate: true } // Set message immediately on component mount/prop availability
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

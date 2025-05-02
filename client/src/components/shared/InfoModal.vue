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
              class="text-lg leading-6 font-medium text-accent uppercase tracking-wider font-secondary"
            >
              {{ title }}
            </h2>
            <button
              type="button"
              @click="closeModal"
              aria-label="Close modal"
              class="rounded-md p-1 text-gray-400 hover:text-white hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800 transition-colors"
            >
              <XCircleIcon class="h-6 w-6" aria-hidden="true" />
            </button>
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
import { InfoModalContentType } from '@/types/app-types';

interface InfoModalProps {
  showModal: boolean;
  type: InfoModalContentType;
}

const props = defineProps<InfoModalProps>();
const emit = defineEmits(['close']);

const message = ref('');
const title = ref('');

// Function to set the message and title based on type
function setContentByType(type: InfoModalContentType) {
  switch (type) {
    case 'us_rate_sheet':
      title.value = 'US Rate Sheet Wizard';
      message.value = `<strong>Unlock Effortless US Rate Sheet Management!</strong><br> 
        This intuitive wizard streamlines your workflow, saving you time and ensuring pinpoint accuracy.<br><br>
        Simply drag & drop or click to upload your Rate Deck CSV containing:
        <ul class="list-disc list-inside my-2 space-y-1 pl-4">
          <li><code class="bg-gray-700 px-1 rounded text-accent text-sm">NPANXX(or NPA + NXX)</code></li>
          <li><code class="bg-gray-700 px-1 rounded text-accent text-sm">Interstate Rate</code></li>
          <li><code class="bg-gray-700 px-1 rounded text-accent text-sm">Intrastate Rate</code></li>
          <li><code class="bg-gray-700 px-1 rounded text-accent text-sm">Indeterminate Rate</code></li>
        </ul>
        <br>
        Once uploaded, unleash <strong>powerful rate adjustments</strong>: increase or decrease rates by precise percentages or fixed amounts.<br> 
        Target specific NPAs, individual NPANXXs, or even entire states or provinces.
        <br><br>
        Get surgical with your rate adjustments!<br><br>
        Once you have your adjustments, you can set an effective date and export your new rate sheet for use in your switch provider's portal.<br><br>
        Say goodbye to leaving minutes or margin on the table...`;
      break;
    case 'az_rate_sheet':
      title.value = 'A-Z Rate Sheet Wizard';
      message.value = `<strong>Effortlessly Manage Global Rates!</strong><br>This tool simplifies managing changes for your international A-Z rate decks.<br><br>Upload your CSV file containing at least these columns:
        <ul class="list-disc list-inside my-2 space-y-1 pl-4">
          <li><code class="bg-gray-700 px-1 rounded text-accent text-sm">Dial Code</code> (or Prefix)</li>
          <li><code class="bg-gray-700 px-1 rounded text-accent text-sm">Country Name</code> (or Destination)</li>
          <li><code class="bg-gray-700 px-1 rounded text-accent text-sm">Rate</code></li>
        </ul>
        Optionally include columns for <code class="bg-gray-700 px-1 rounded text-accent text-sm">Minimum Duration</code> and <code class="bg-gray-700 px-1 rounded text-accent text-sm">Billing Increments</code> for enhanced precision.<br><br>
        The system automatically parses your file, validates the data, and stores it locally in your browser for fast access.<br>
        From there you can make changes to the rates, set an effective date, and export your new rate sheet for use in your switch provider's portal.<br>
        Simplify your international pricing strategy today!`;
      break;
    case 'us_comparison':
      title.value = 'US Rate Deck Analyzer';
      message.value = `
        <strong>Analyze & Compare US Rate Decks Like Never Before!</strong><br> This powerful tool allows you to upload and compare multiple US rate decks side-by-side.<br><br>
         Simply drag & drop or click to upload your Rate Decks as CSV containing:
       <ul class="list-disc list-inside my-2 space-y-1 pl-4">
          <li><code class="bg-gray-700 px-1 rounded text-accent text-sm">NPANXX(or NPA + NXX)</code></li>
          <li><code class="bg-gray-700 px-1 rounded text-accent text-sm">Interstate Rate</code></li>
          <li><code class="bg-gray-700 px-1 rounded text-accent text-sm">Intrastate Rate</code></li>
          <li><code class="bg-gray-700 px-1 rounded text-accent text-sm">Indeterminate Rate</code></li>
        </ul>
        <br>
        During the upload process, you'll map your columns to ensure accuracy. Once uploaded, the analyzer generates two insightful reports:
        <ul class="list-disc list-inside my-2 space-y-1 pl-4">
          <li><strong>Code Report:</strong> Identifies NPA and NXXs that are present in one deck but not the other. SHOWS LERG Coverage by NPA and state level</li>
          <li><strong>Pricing Report:</strong> Compare over all jurisdicational rates and filter for NPA, NPANXX, or at the State/Province level.</li>
        </ul>
        Leverage this tool to optimize your US termination strategy, identify cost-saving opportunities, and ensure competitive pricing.
      `;
      break;
    case 'az_comparison':
      title.value = 'A-Z Rate Deck Analyzer';
      message.value = `
        <strong>Deep Dive into A-Z Rate Deck Comparisons!</strong> This analyzer empowers you to upload and meticulously compare two international A-Z rate decks.<br><br>
        Upload your CSV files. Each file should contain:
        <ul class="list-disc list-inside my-2 space-y-1 pl-4">
          <li><code class="bg-gray-700 px-1 rounded text-accent text-sm">Dial Code</code> (Prefix)</li>
          <li><code class="bg-gray-700 px-1 rounded text-accent text-sm">Country Name</code> (Destination)</li>
          <li><code class="bg-gray-700 px-1 rounded text-accent text-sm">Rate</code></li>
        </ul>
        Map your columns accurately during the upload preview.<br>Once processed, the tool generates two key reports:
        <ul class="list-disc list-inside my-2 space-y-1 pl-4">
          <li><strong>Code Report:</strong> Pinpoints differences in dial code coverage and destination names between the decks.</li>
          <li><strong>Pricing Report:</strong> Reveals rate discrepancies for matching dial codes across both decks.</li>
        </ul>
        Use these insights to refine your international routing, negotiate better rates, and gain a competitive edge in the global market.
      `;
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

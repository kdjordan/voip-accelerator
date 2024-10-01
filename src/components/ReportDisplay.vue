<template>
  <div>
    <div class="flex justify-center mb-4">
      <button 
        @click="activeReport = 'code'"
        :class="[
          'px-4 py-2 mx-2 rounded-lg transition-colors duration-200',
          activeReport === 'code' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-500 text-gray-300 hover:bg-gray-600'
        ]"
      >
        Code Report
      </button>
      <button 
        @click="activeReport = 'pricing'"
        :class="[
          'px-4 py-2 mx-2 rounded-lg transition-colors duration-200',
          activeReport === 'pricing' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-500 text-gray-300 hover:bg-gray-600'
        ]"
      >
        Pricing Report
      </button>
      <button 
        @click="handleGotoFiles"
        class="px-4 py-2 mx-2 rounded-lg transition-colors duration-200 bg-gray-500 text-gray-300 hover:bg-gray-600"
      >
        Goto Files
      </button>
    </div>
    <div class="report-content">
      <CodeReportAZ v-if="activeReport === 'code' && codeReport" :report="codeReport" />
      <PricingReportAZ v-if="activeReport === 'pricing' && pricingReport" :report="pricingReport" />
      <div v-if="!codeReport && !pricingReport">No reports available.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeReportAZ from './CodeReportAZ.vue';
import PricingReportAZ from './PricingReportAZ.vue';
import { type AzCodeReport, type AzPricingReport } from '../../types/app-types';
import { useDBstate } from '@/stores/dbStore';

const dbStore = useDBstate();

interface Props {
  codeReport: AzCodeReport | null;
  pricingReport: AzPricingReport | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['gotoFiles']);

const activeReport = ref<'code' | 'pricing'>('code');

function handleGotoFiles() {
  dbStore.setShowAzUploadComponents(true);
  emit('gotoFiles');
}
</script>

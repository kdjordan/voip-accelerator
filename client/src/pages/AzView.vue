<template>
  <div class="min-h-screen text-white p-8 w-full">
    <h1 class="mb-8">
      <span
        class="text-sizeXl text-accent uppercase rounded-lg px-4 py-2 font-secondary"
      >
        AZ Rate Deck Analyzer
      </span>
    </h1>
    <AZContentHeader />

    <div>
      <transition
        name="fade"
        mode="out-in"
        appear
      >
        <div :key="azStore.getActiveReportType">
          <AZFileUploads v-if="azStore.getActiveReportType === ReportTypes.FILES" />
          <CodeReportAZ
            v-if="azStore.getActiveReportType === ReportTypes.CODE"
            :report="azStore.getCodeReport"
          />
          <PricingReportAZ
            v-if="azStore.getActiveReportType === ReportTypes.PRICING"
            :report="azStore.getPricingReport"
          />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AZFileUploads from '@/components/az/AZFileUploads.vue';
  import CodeReportAZ from '@/components/az/AZCodeReport.vue';
  import PricingReportAZ from '@/components/az/AZPricingReport.vue';
  import AZContentHeader from '@/components/az/AZContentHeader.vue';
  import { useAzStore } from '@/stores/az-store';
  import { ReportTypes } from '@/types/app-types';
  import { onMounted } from 'vue';
  import { loadSampleDecks } from '@/utils/load-sample-data';
  import { DBName } from '@/types/app-types';

  const azStore = useAzStore();

  onMounted(async () => {
    // const sampleDecks = setTimeout(async () => {
    //   await loadSampleDecks([DBName.AZ]);
    // }, 1000);
    // return () => clearTimeout(sampleDecks);
  });
</script>

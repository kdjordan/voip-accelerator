<template>
  <div class="min-h-screen text-white p-8 w-full">
    <h1 class="text-sizeXl tracking-wide text-accent uppercase mb-8 font-secondary">US Rate Deck Analyzer</h1>
    <USContentHeader />

    <div>
      <transition
        name="fade"
        mode="out-in"
        appear
      >
        <div :key="usStore.getActiveReportType">
          <USFileUploads v-if="usStore.activeReportType === ReportTypes.FILES" />
          <!-- <USCodeReport
            v-if="npanxxStore.activeReportType === ReportTypes.CODE"
            :report="npanxxStore.codeReport"
          />
          <USPricingReport
            v-if="npanxxStore.activeReportType === ReportTypes.PRICING"
            :report="npanxxStore.getPricingReport"
          /> -->
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
  import USFileUploads from '@/components/us/USFileUploads.vue';
  import USCodeReport from '@/components/us/USCodeReport.vue';
  import USPricingReport from '@/components/us/USPricingReport.vue';
  import USContentHeader from '@/components/us/USContentHeader.vue';
  import { useUsStore } from '@/stores/us-store';
  import { ReportTypes } from '@/types/app-types';
  import { onMounted } from 'vue';
  import { loadSampleDecks } from '@/utils/load-sample-data';
  import { DBName } from '@/types/app-types';

  const usStore = useUsStore();

  // Uncomment to enable sample data loading during development
  onMounted(async () => {
    // Load sample data with a short delay to ensure components are ready
    // const sampleDecks = setTimeout(async () => {
    //   try {
    //     await loadSampleDecks([DBName.US]);
    //     console.log('US sample data loaded successfully');
    //   } catch (error) {
    //     console.error('Failed to load US sample data:', error);
    //   }
    // }, 1000);
    
    // return () => clearTimeout(sampleDecks);
  });
</script>

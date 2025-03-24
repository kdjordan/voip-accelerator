<template>
  <div class="min-h-screen text-white p-8 w-full">
    <h1 class="mb-8">
      <span class="text-sizeXl text-accent uppercase rounded-lg px-4 py-2 font-secondary">
        US Rate Deck Analyzer
      </span>
    </h1>
    <USContentHeader />

    <div>
      <transition name="fade" mode="out-in" appear>
        <div :key="usStore.getActiveReportType">
          <USFileUploads v-if="usStore.activeReportType === ReportTypes.FILES" />
          <USCodeReport
            v-if="
              usStore.activeReportType === ReportTypes.CODE &&
              (usStore.hasSingleFileReport || usStore.reportsGenerated)
            "
            :report="usStore.getCodeReport"
          />
          <USPricingReport
            v-if="usStore.activeReportType === ReportTypes.PRICING && usStore.reportsGenerated"
            :report="usStore.getPricingReport"
          />
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
import { lergFacadeService, OperationStatus, ErrorSource, type ErrorInfo } from '@/services/lerg-facade.service';
import { loadSampleDecks } from '@/utils/load-sample-data';
import { DBName } from '@/types/app-types';

const usStore = useUsStore();

// Uncomment to enable sample data loading during development
onMounted(async () => {
  console.log('No LERG data found, initializing with fresh data');
  const result = await lergFacadeService.initialize(true);

  if (result.status === OperationStatus.ERROR) {
    const error = result.error || new Error('Failed to initialize LERG data');
    const formattedError = formatErrorMessage(
      error,
      result.errorInfo?.source,
      result.errorInfo?.details
    );

    throw new Error(formattedError.message);
  }
});
</script>

<template>
  <div class="flex flex-col items-center w-full min-h-[400px]">
    <h1 class="text-4xl my-2 text-white inline-block">US Pricing</h1>
    <USContentHeader />

    <div class="w-full max-w-5xl">
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
  import USFileUploads from '@/domains/us/components/USFileUploads.vue';
  import USCodeReport from '@/domains/us/components/USCodeReport.vue';
  import USPricingReport from '@/domains/us/components/USPricingReport.vue';
  import USContentHeader from '@/domains/us/components/USContentHeader.vue';
  import { useNpanxxStore } from '@/domains/us/store';
  import { ReportTypes } from '@/domains/shared/types';

  const usStore = useNpanxxStore();
</script>

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
  import USFileUploads from '@/components/us/USFileUploads.vue';
  import USCodeReport from '@/components/us/USCodeReport.vue';
  import USPricingReport from '@/components/us/USPricingReport.vue';
  import USContentHeader from '@/components/us/USContentHeader.vue';
  import { useUsStore } from '@/stores/us-store';
  import { ReportTypes } from '@/types/app-types';

  const usStore = useUsStore();
</script>

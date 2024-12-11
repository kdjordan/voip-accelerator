<template>
  <div class="flex flex-col items-center w-full min-h-[400px]">
    <h1 class="text-4xl my-2 text-white inline-block">A-Z Pricing</h1>
    <AZContentHeader />

    <div class="w-full max-w-5xl">
      <transition name="fade" mode="out-in" appear>
        <div :key="azStore.getActiveReportType()">
          <AZFileUploads v-if="azStore.getActiveReportType() === ReportTypes.FILES" />
          <CodeReportAZ
            v-if="azStore.getActiveReportType() === ReportTypes.CODE"
            :report="azStore.getCodeReport()"
          />
          <PricingReportAZ
            v-if="azStore.getActiveReportType() === ReportTypes.PRICING"
            :report="azStore.getPricingReport()"
          />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import AZFileUploads from "@/domains/az/components/AZFileUploads.vue";
import CodeReportAZ from "@/domains/az/components/AZCodeReport.vue";
import PricingReportAZ from "@/domains/az/components/AZPricingReport.vue";
import AZContentHeader from "@/domains/az/components/AZContentHeader.vue";
import { useAzStore } from "@/domains/az/store";
import { ReportTypes } from '@/domains/shared/types';

const azStore = useAzStore();
</script>

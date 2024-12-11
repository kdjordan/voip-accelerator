<template>
  <div class="flex flex-col items-center w-full min-h-[400px]">
    <h1 class="text-4xl my-2 text-white inline-block">US Pricing</h1>
    <USContentHeader />

    <div class="w-full max-w-5xl">
      <transition name="fade" mode="out-in" appear>
        <div :key="npanxxStore.getActiveReportType()">
          <USFileUploads v-if="npanxxStore.getActiveReportType() === ReportTypes.FILES" />
          <CodeReportUS
            v-if="npanxxStore.getActiveReportType() === ReportTypes.CODE"
            :report="npanxxStore.getCodeReport()"
          />
          <PricingReportUS
            v-if="npanxxStore.getActiveReportType() === ReportTypes.PRICING"
            :report="npanxxStore.getPricingReport()"
          />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import USFileUploads from "@/domains/npanxx/components/USFileUploads.vue";
import CodeReportUS from "@/domains/npanxx/components/USCodeReport.vue";
import PricingReportUS from "@/domains/npanxx/components/USPricingReport.vue";
import USContentHeader from "@/domains/npanxx/components/USContentHeader.vue";
import { useNpanxxStore } from "@/domains/npanxx/store";
import { ReportTypes } from "@/domains/shared/types";

const npanxxStore = useNpanxxStore();
</script>

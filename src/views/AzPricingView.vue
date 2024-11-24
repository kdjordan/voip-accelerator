<template>
  <div class="flex flex-col items-center w-full min-h-[400px]">
    <!-- Content Section - No header here since it's in AZFileUploads -->
    <h1 class="text-4xl my-2 text-white inline-block">A-Z Pricing</h1>
    <AZContentHeader />

    <div class="w-full max-w-5xl">
      <transition name="fade" mode="out-in" appear>
        <div :key="dbStore.getActiveReportAZ">
          <AZFileUploads v-if="dbStore.getActiveReportAZ === 'files'" />
          <CodeReportAZ
            v-if="dbStore.getActiveReportAZ === 'code'"
            :report="dbStore.getAzCodeReport"
          />
          <PricingReportAZ
            v-if="dbStore.getActiveReportAZ === 'pricing'"
            :report="dbStore.getAzPricingReport"
          />
          <div
            v-if="!dbStore.getAzCodeReport && !dbStore.getAzPricingReport"
            class="text-center text-foreground"
          >
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import AZFileUploads from "@/components/AZ/AZFileUploads.vue";
import CodeReportAZ from "@/components/AZ/AZCodeReport.vue";
import PricingReportAZ from "@/components/AZ/AZPricingReport.vue";
import AZContentHeader from "@/components/AZ/AZContentHeader.vue";
import { useDBstate } from "@/stores/dbStore";

const dbStore = useDBstate();
</script>

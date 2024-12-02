<template>
  <div class="flex flex-col items-center" id="us-file-uploads">
    <div class="mb-4 text-center">
      <p
        v-if="!npanxxStore.isFull"
        class="text-center text-sizeBase text-foreground mb-8"
      >
        Upload
        <span class="uppercase text-white">your</span>
        current rates and the rates of your
        <span class="uppercase text-white">prospective carrier.</span>
        <br />
        We will generate you a report showing the best opportunities for you to
        buy and sell.
      </p>
    </div>
    <div v-if="npanxxStore.reportsGenerated" class="flex justify-center my-4">
      <button
        v-for="type in reportTypes"
        :key="type"
        @click="npanxxStore.setActiveReportType(type)"
        :class="[
          'py-3 px-6 mx-2 rounded-lg transition-colors',
          {
            'btn-active': npanxxStore.activeReportType === type,
            'btn-inactive': npanxxStore.activeReportType !== type,
          },
        ]"
      >
        <span v-if="type !== ReportTypes.FILES">
          {{ type.charAt(0).toUpperCase() + type.slice(1) }} Report
        </span>
        <span v-else>
          {{ type.charAt(0).toUpperCase() + type.slice(1) }}
        </span>
      </button>
      <button
        @click="handleReset"
        class="btn-lg btn-destructive"
      >
        Reset
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNpanxxStore } from '@/domains/npanxx/store';
import { ReportTypes, type ReportType } from '@/domains/shared/types/base-types';
import { resetReportApi } from "@/API/api";

const npanxxStore = useNpanxxStore();

const reportTypes: readonly ReportType[] = [
  ReportTypes.FILES,
  ReportTypes.CODE,
  ReportTypes.PRICING
] as const;

async function handleReset() {
  console.log("Resetting the US report");
  npanxxStore.setActiveReportType(ReportTypes.FILES);
  await resetReportApi("us");
}
</script>

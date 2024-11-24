<template>
  <div class="flex flex-col items-center" id="az-file-uploads">
    <div class="mb-4 text-center">
      <p
        v-if="!dbStore.getIsAZfull"
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
    <div v-if="dbStore.getAzReportsGenerated" class="flex justify-center my-4">
      <button
        v-for="type in reportTypes"
        :key="type"
        @click="dbStore.setActiveReportAZ(type)"
        :class="[
          'py-3 px-6 mx-2 rounded-lg transition-colors',
          {
            'btn-active':
              dbStore.getActiveReportAZ === type,
            'btn-inactive':
              dbStore.getActiveReportAZ !== type,
          },
        ]"
      >
        <span v-if="type !== 'files'">
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
import { useDBstate } from "@/stores/dbStore";
import { resetReportApi } from "@/API/api";
import { type ReportStateType } from "@/types/app-types";
const dbStore = useDBstate();

const reportTypes: ReportStateType[] = ["files", "code", "pricing"];

async function handleReset() {
  console.log("Resetting the AZ report");
  dbStore.setActiveReportAZ("files");
  await resetReportApi("az");
}
</script>

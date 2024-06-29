<template>
  <div>
    <div class="mx-auto p-6 space-y-6 pt-32">
      <div
        v-if="!isReporting"
        class="max-w-[1200px] mx-auto flex flex-col gap-4"
      >
        <UploadComponent
          mssg="<h2 class='text-sizeLg'>Upload YOUR rates as CSV.</h2><br /><br /> (You can drag and drop or click <span style='color:blue;'>here</span> to select from your computer.)"
          v-if="file1 === null"
          DBname="us"
        />
        <UploadComponent
          mssg="<h2 class='text-sizeLg'>Upload CARRIER rates as CSV.</h2><br /><br /> (You can drag and drop or click <span style='color:blue;'>here</span> to select from your computer.)"
          v-if="file2 === null"
          DBname="us"
        />
       
        <button
          v-if="DBstate.AZFilesUploadedCount === 2"
          @click="makeReport"
          class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition text-center"
        >
          Compare Files
        </button>
      {{ DBstate.AZFilesUploadedCount }}
      </div>
      <div v-else>
        <GenerateReport
          v-if="report"
          :report="report"
          :details="details"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import UploadComponent from '../components/UploadComponent.vue';
import GenerateReport from '../components/GenerateReport.vue';
import { type ComparisonReport } from '../../types/app-types';
import { useIndexedDB } from '../composables/useIndexDB';

const { DBstate } =
		useIndexedDB();

const file1 = ref<File | null>(null);
const file2 = ref<File | null>(null);

const isReporting = ref<boolean>(false);
const report = ref<ComparisonReport | null>(null);
const details = ref<{
  fileName1: string;
  fileName2: string;
} | null>(null);

function makeReport() {
  //start the web worker to generate report
}


</script>

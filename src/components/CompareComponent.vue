<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">Comparison Report</h2>
    <div v-if="comparisonResults.length">
      <table class="min-w-full bg-white border border-gray-200">
        <thead class="bg-gray-100">
          <tr>
            <th class="py-2 px-4 border-b">Dial Code</th>
            <th class="py-2 px-4 border-b">Rate Difference</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="result in comparisonResults" :key="result.dialCode">
            <td class="py-2 px-4 border-b">{{ result.dialCode }}</td>
            <td class="py-2 px-4 border-b">{{ result.rateDifference }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import Papa from 'papaparse';

interface ComparisonResult {
  dialCode: string;
  rateDifference: number;
}

interface Props {
  file1: FileEmit | null;
  file2: FileEmit | null;
}

const props = defineProps<Props>();
const comparisonResults = ref<ComparisonResult[]>([]);

function parseCSV(file: File, callback: (data: Record<string, string>[]) => void) {
  Papa.parse(file, {
    header: true,
    complete(results: { data: Record<string, string>[] }) {
      callback(results.data);
    }
  });
}

function compareFiles() {
  console.log('comparing files in Compare Component 1 ::', props.file1)
  console.log('comparing files in Compare Component 2 ::', props.file2)
  // if (props.file1 && props.file2) {
  //   parseCSV(props.file1, (data1) => {
  //     parseCSV(props.file2, (data2) => {
  //       const map1 = new Map<string, number>();
  //       const map2 = new Map<string, number>();

  //       data1.forEach(row => {
  //         const dialCode = row[props.dialCodeColumnFile1];
  //         const rate = parseFloat(row[props.rateColumnFile1]);
  //         if (dialCode && !isNaN(rate)) {
  //           map1.set(dialCode, rate);
  //         }
  //       });

  //       data2.forEach(row => {
  //         const dialCode = row[props.dialCodeColumnFile2];
  //         const rate = parseFloat(row[props.rateColumnFile2]);
  //         if (dialCode && !isNaN(rate)) {
  //           map2.set(dialCode, rate);
  //         }
  //       });

  //       const results: ComparisonResult[] = [];

  //       map1.forEach((rate1, dialCode) => {
  //         if (map2.has(dialCode)) {
  //           const rate2 = map2.get(dialCode)!;
  //           const rateDifference = rate1 - rate2;
  //           results.push({ dialCode, rateDifference });
  //         }
  //       });

  //       comparisonResults.value = results;
  //     });
  //   });
  // }
}

watchEffect(() => {
  compareFiles();
});
</script>

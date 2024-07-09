<template>
  <div class="bg-background rounded min-w-[950px] m-auto w-full p-6">
    <h2 class="text-center text-sizeXl uppercase pb-4 font-primary">Report</h2>

    <div>
      <h3 class="pb-4 uppercase"><span class="text-accent">{{ details?.fileName1 }}</span> :: should buy these destinations from :: <span class="text-accent">{{ details?.fileName2 }}</span></h3>
      <table>
        <thead>
          <tr>
            <th>Dial Code</th>
            <th>Destination</th>
            <th>{{ details?.fileName1 }} Rate</th>
            <th>{{ details?.fileName2 }} Rate</th>
            <th>Difference (%)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, dialCode) in report.higherRatesForFile1" :key="dialCode">
            <td>{{ item.dialCode }}</td>
            <td>{{ item.destName }}</td>
            <td>{{ item.rateFile1 }}</td>
            <td>{{ item.rateFile2 }}</td>
            <td>{{ item.percentageDifference.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <h3 class="pb-4 uppercase">{{ details?.fileName1 }} :: should sell these destinations to :: <span class="text-accent">{{ details?.fileName2 }}</span></h3>
      <table>
        <thead>
          <tr>
            <th>Dial Code</th>
            <th>Destination</th>
            <th>{{ details?.fileName1 }} Rate</th>
            <th>{{ details?.fileName2 }} Rate</th>
            <th>Difference (%)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, dialCode) in report.higherRatesForFile2" :key="dialCode">
            <td>{{ item.dialCode }}</td>
            <td>{{ item.destName }}</td>
            <td>{{ item.rateFile1 }}</td>
            <td>{{ item.rateFile2 }}</td>
            <td>{{ item.percentageDifference.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <h3 class="pb-4 uppercase">Same Rates</h3>
      <table>
        <thead>
          <tr>
            <th>Dial Code</th>
            <th>Destination</th>
            <th>{{ details?.fileName1 }} Rate</th>
            <th>{{ details?.fileName2 }} Rate</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, dialCode) in report.sameRates" :key="dialCode">
            <td>{{ dialCode }}</td>
            <td>{{ item.destName }}</td>
            <td>{{ item.rateFile1 }}</td>
            <td>{{ item.rateFile2 }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <h3 class="pb-4 uppercase">Non-Matching Codes</h3>
      <table>
        <thead>
          <tr>
            <th>Dial Code</th>
            <th>Destination</th>
            <th>Rate</th>
            <th>File</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in report.nonMatchingCodes" :key="index">
            <td>{{ item.dialCode }}</td>
            <td>{{ item.destName }}</td>
            <td>{{ item.rate }}</td>
            <td>{{ item.file }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>


<script setup lang="ts">
import { type ComparisonReport } from '../../types/app-types';
  

defineProps<{
  report: ComparisonReport;
  details: { fileName1: string; fileName2: string } | null;
}>();
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}
</style>

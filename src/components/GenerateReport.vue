<template>
  <div>
    <h2>Comparison Report</h2>
    <div>
      <h3>Higher Rates for File 1</h3>
      <ul>
        <li v-for="(item, dialCode) in report.higherRatesForFile1" :key="dialCode">
          Dial Code: {{ item.dialCode }}, Destination: {{ item.destName }}, File 1 Rate: {{ item.rateFile1 }}, File 2 Rate: {{ item.rateFile2 }}, Difference: {{ item.percentageDifference.toFixed(2) }}%
        </li>
      </ul>
    </div>
    <div>
      <h3>Higher Rates for File 2</h3>
      <ul>
        <li v-for="(item, dialCode) in report.higherRatesForFile2" :key="dialCode">
          Dial Code: {{ item.dialCode }}, Destination: {{ item.destName }}, File 1 Rate: {{ item.rateFile1 }}, File 2 Rate: {{ item.rateFile2 }}, Difference: {{ item.percentageDifference.toFixed(2) }}%
        </li>
      </ul>
    </div>
    <div>
      <h3>Same Rates</h3>
      <ul>
        <li v-for="(item, dialCode) in report.sameRates" :key="dialCode">
          Dial Code: {{ dialCode }}, Destination: {{ item.destName }}, Rate: {{ item.rateFile1 }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ComparisonReport {
  higherRatesForFile1: {
    [dialCode: string]: {
      dialCode: string;
      destName: string;
      rateFile1: number;
      rateFile2: number;
      percentageDifference: number;
    };
  };
  higherRatesForFile2: {
    [dialCode: string]: {
      dialCode: string;
      destName: string;
      rateFile1: number;
      rateFile2: number;
      percentageDifference: number;
    };
  };
  sameRates: {
    [dialCode: string]: {
      destName: string;
      rateFile1: number;
      rateFile2: number;
    };
  };
}
import { defineProps } from 'vue';

const props = defineProps<{
  report: ComparisonReport;
}>();
</script>

<template>
  <div class="p-6 rounded-lg overflow-hidden bg-gray-900/50">
    <table class="w-full text-sm">
      <thead>
        <tr class="text-left text-gray-400">
          <th class="py-2 px-2 font-medium">Margin</th>
          <th class="py-2 px-2 font-medium text-right">Match Count</th>
          <th class="py-2 px-2 font-medium text-right">% of Comparable</th>
        </tr>
      </thead>
      <tbody class="text-gray-300">
        <MarginAnalysisTableRowAZ label="< 10%" :data="analysis.lessThan10" />
        <MarginAnalysisTableRowAZ label="10% - 20%" :data="analysis.between10And20" />
        <MarginAnalysisTableRowAZ label="20% - 30%" :data="analysis.between20And30" />
        <MarginAnalysisTableRowAZ label="30% - 40%" :data="analysis.between30And40" />
        <MarginAnalysisTableRowAZ label="40% - 50%" :data="analysis.between40And50" />
        <MarginAnalysisTableRowAZ label="50% - 60%" :data="analysis.between50And60" />
        <MarginAnalysisTableRowAZ label="60% - 70%" :data="analysis.between60And70" />
        <MarginAnalysisTableRowAZ label="70% - 80%" :data="analysis.between70And80" />
        <MarginAnalysisTableRowAZ label="80% - 90%" :data="analysis.between80And90" />
        <MarginAnalysisTableRowAZ label="90% - 100%" :data="analysis.between90And100" />
        <MarginAnalysisTableRowAZ label="> 100%" :data="analysis.greaterThan100" />
        <tr class="border-t-2 border-gray-700 font-semibold text-white">
          <td class="py-2 px-2">Total</td>
          <td class="py-2 px-2 text-right">{{ analysis.totalMatches }}</td>
          <td class="py-2 px-2 text-right">{{ analysis.totalPercent.toFixed(1) }}%</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
  import { type MarginAnalysisAZ } from '@/types/domains/az-types';
  import MarginAnalysisTableRowAZ from './MarginAnalysisTableRowAZ.vue';

  defineProps<{
    analysis: MarginAnalysisAZ;
  }>();
</script>

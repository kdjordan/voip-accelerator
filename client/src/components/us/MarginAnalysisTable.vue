<template>
  <div class="p-6">
    <table class="w-full text-sm">
      <thead>
        <tr class="text-left text-gray-400">
          <th class="py-2 px-2 font-medium">Margin</th>
          <th class="py-2 px-2 font-medium text-right">Match (Inter)</th>
          <th class="py-2 px-2 font-medium text-right">%</th>
          <th class="py-2 px-2 font-medium text-right">Match (Intra)</th>
          <th class="py-2 px-2 font-medium text-right">%</th>
        </tr>
      </thead>
      <tbody class="text-gray-300">
        <MarginAnalysisTableRow label="< 10%" :data="analysis.lessThan10" />
        <MarginAnalysisTableRow label="10% - 20%" :data="analysis.between10And20" />
        <MarginAnalysisTableRow label="20% - 30%" :data="analysis.between20And30" />
        <MarginAnalysisTableRow label="30% - 40%" :data="analysis.between30And40" />
        <MarginAnalysisTableRow label="40% - 50%" :data="analysis.between40And50" />
        <MarginAnalysisTableRow label="50% - 60%" :data="analysis.between50And60" />
        <MarginAnalysisTableRow label="60% - 70%" :data="analysis.between60And70" />
        <MarginAnalysisTableRow label="70% - 80%" :data="analysis.between70And80" />
        <MarginAnalysisTableRow label="80% - 90%" :data="analysis.between80And90" />
        <MarginAnalysisTableRow label="90% - 100%" :data="analysis.between90And100" />
        <MarginAnalysisTableRow label="> 100%" :data="analysis.greaterThan100" />
        <tr class="border-t-2 border-gray-700 font-semibold text-white">
          <td class="py-2 px-2">Total</td>
          <td class="py-2 px-2 text-right">{{ analysis.totalInterMatches }}</td>
          <td class="py-2 px-2 text-right">{{ analysis.totalPercentInter.toFixed(1) }}%</td>
          <td class="py-2 px-2 text-right">{{ analysis.totalIntraMatches }}</td>
          <td class="py-2 px-2 text-right">{{ analysis.totalPercentIntra.toFixed(1) }}%</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
  import { type MarginAnalysis } from '@/types/domains/us-types';
  import MarginAnalysisTableRow from './MarginAnalysisTableRow.vue';

  defineProps<{
    analysis: MarginAnalysis;
  }>();
</script>

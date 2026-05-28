<template>
  <div class="mt-4 overflow-x-auto">
    <table class="min-w-full text-sm">
      <thead>
        <tr class="font-display text-[11px] uppercase tracking-wider text-fg-faint">
          <th class="py-2 pr-3 text-left font-medium">NPA</th>
          <th class="py-2 px-3 text-left font-medium">State</th>
          <th class="py-2 px-3 text-right font-medium">Matched Codes</th>
          <th class="py-2 px-3 text-right font-medium">Avg Rate A</th>
          <th class="py-2 px-3 text-right font-medium">Avg Rate B</th>
          <th class="py-2 px-3 text-right font-medium">Avg Margin</th>
          <th class="py-2 pl-3 text-right font-medium">Margin %</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-line-divider">
        <tr v-for="row in rows" :key="row.npa" class="text-fg-dim">
          <td class="py-2.5 pr-3 font-display text-fg">{{ row.npa }}</td>
          <td class="py-2.5 px-3 text-fg-faint">{{ row.state }}</td>
          <td class="py-2.5 px-3 text-right font-display tabular-nums">
            {{ row.matchedCodes.toLocaleString() }}
          </td>
          <td class="py-2.5 px-3 text-right font-display tabular-nums">
            ${{ row.avgRateA.toFixed(4) }}
          </td>
          <td class="py-2.5 px-3 text-right font-display tabular-nums">
            ${{ row.avgRateB.toFixed(4) }}
          </td>
          <td class="py-2.5 px-3 text-right font-display tabular-nums">
            ${{ row.avgMargin.toFixed(4) }}
          </td>
          <td
            class="py-2.5 pl-3 text-right font-display tabular-nums font-semibold"
            :class="accent === 'accent' ? 'text-accent' : 'text-warn'"
          >
            {{ row.marginPct.toFixed(2) }}%
          </td>
        </tr>
        <tr v-if="rows.length === 0">
          <td colspan="7" class="py-6 text-center text-fg-mute">No opportunities found.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
  import type { NpaOpportunity } from '@/utils/us-insights';

  defineProps<{
    rows: NpaOpportunity[];
    // Portal palette: `warn` (amber) = Sell side · `accent` (red) = Buy side.
    accent: 'warn' | 'accent';
  }>();
</script>

<template>
	<div v-if="codeReport && pricingReport">
		<!-- Display your reports here -->
		<!-- <pre>{{ JSON.stringify(codeReport, null, 2) }}</pre>
		<pre>{{ JSON.stringify(pricingReport, null, 2) }}</pre> -->
    <PricingReportAZ :report="pricingReport" />
    <CodeReportAZ :report="codeReport" />
		
	</div>
	<div v-else>No reports available.</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue';
  import CodeReportAZ from './CodeReportAZ.vue';    
  import PricingReportAZ from './PricingReportAZ.vue';

	import type {
		AzCodeReport,
		AzPricingReport,
	} from '../../types/app-types';

	const props = defineProps<{
		codeReport: AzCodeReport | null;
		pricingReport: AzPricingReport | null;
	}>();

	const hasReports = computed(
		() => props.codeReport && props.pricingReport
	);

	// Add any additional logic for displaying the reports
</script>

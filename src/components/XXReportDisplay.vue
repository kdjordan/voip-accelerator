<template>
	<div id="report-display">
		<CodeReportAZ
			v-if="activeReport === 'code' && codeReport"
			:report="codeReport"
		/>
		<PricingReportAZ
			v-if="activeReport === 'pricing' && pricingReport"
			:report="pricingReport"
		/>
		<div v-if="!codeReport && !pricingReport">
			No reports available.
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue';
	import CodeReportAZ from './US/AZ/AZCodeReport.vue';
	import PricingReportAZ from './US/AZ/AZPricingReport.vue';
	import {
		type AzCodeReport,
		type AzPricingReport,
	} from '../types/app-types';
	import { useDBstate } from '@/stores/dbStore';
	import { resetReportApi } from '@/API/api';
	const dbStore = useDBstate();

	interface Props {
		codeReport: AzCodeReport | null;
		pricingReport: AzPricingReport | null;
	}

	const props = defineProps<Props>();
	const emit = defineEmits(['gotoFiles']);

	const activeReport = ref<'code' | 'pricing'>('code');

</script>

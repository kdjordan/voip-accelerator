<template>
	<div id="az-pricing" class="flex flex-col items-center pt-8 h-full w-full">
		<div
			v-if="dbStore.getAzReportsGenerated"
			class="flex justify-center mb-4"
		>
			<button
				@click="dbStore.setActiveReportAZ('files')"
				:class="[
					'px-4 py-2 mx-2 rounded-lg transition-colors duration-200',
					dbStore.getActiveReportAZ === 'files'
						? 'bg-blue-500 text-white'
						: 'bg-gray-500 text-gray-300 hover:bg-gray-600',
				]"
			>
				Files
			</button>
			<button
				@click="dbStore.setActiveReportAZ('code')"
				:class="[
					'px-4 py-2 mx-2 rounded-lg transition-colors duration-200',
					dbStore.getActiveReportAZ === 'code'
						? 'bg-blue-500 text-white'
						: 'bg-gray-500 text-gray-300 hover:bg-gray-600',
				]"
			>
				Code Report
			</button>
			<button
				@click="dbStore.setActiveReportAZ('pricing')"
				:class="[
					'px-4 py-2 mx-2 rounded-lg transition-colors duration-200',
					dbStore.getActiveReportAZ === 'pricing'
						? 'bg-blue-500 text-white'
						: 'bg-gray-500 text-gray-300 hover:bg-gray-600',
				]"
			>
				Pricing Report
			</button>
			<button
				@click="handleReset"
				class="px-4 py-2 mx-2 rounded-lg transition-colors duration-200 bg-red-500 text-white hover:bg-red-600"
			>
				Reset
			</button>
		</div>
		<div>
			<AZFileUploads v-if="dbStore.getActiveReportAZ === 'files'" />
			<CodeReportAZ
				v-if="dbStore.getActiveReportAZ === 'code'"
				:report="dbStore.getAzCodeReport"
			/>
			<PricingReportAZ
				v-if="dbStore.getActiveReportAZ === 'pricing'"
				:report="dbStore.getAzPricingReport"
			/>
			<div
				v-if="
					!dbStore.getAzCodeReport == null &&
					!dbStore.getAzPricingReport
				"
			>
				No reports available.
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import AZFileUploads from '../components/AZFileUploads.vue';
	import CodeReportAZ from '../components/AZCodeReport.vue';
	import PricingReportAZ from '../components/AZPricingReport.vue';
	import { resetReportApi } from '@/API/api';
	import { useDBstate } from '@/stores/dbStore';

	const dbStore = useDBstate();

	async function handleReset() {
		console.log('Resetting the AZ report');
		dbStore.setActiveReportAZ('files');
		await resetReportApi('az');
	}
</script>

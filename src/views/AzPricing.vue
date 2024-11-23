<template>
	<div class="flex flex-col items-center w-full max-w-5xl min-h-[700px]">
		<!-- Content Section - No header here since it's in AZFileUploads -->
		<div class="w-full max-w-2xl">
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
				v-if="!dbStore.getAzCodeReport == null && !dbStore.getAzPricingReport"
				class="text-center text-foreground"
			>
				No reports available.
			</div>
		</div>

		<!-- Report Navigation -->
		<div v-if="dbStore.getAzReportsGenerated" class="flex justify-center mt-8">
			<button
				v-for="type in ['files', 'code', 'pricing']"
				:key="type"
				@click="dbStore.setActiveReportAZ(type)"
				:class="[
					'py-3 px-6 mx-2 rounded-lg transition-colors',
					{
						'bg-white/10 hover:bg-white/20 text-foreground': dbStore.getActiveReportAZ === type,
						'bg-muted/50 text-foreground/50': dbStore.getActiveReportAZ !== type
					}
				]"
			>
				{{ type.charAt(0).toUpperCase() + type.slice(1) }} Report
			</button>
			<button
				@click="handleReset"
				class="py-3 px-6 mx-2 rounded-lg transition-colors bg-white/10 hover:bg-white/20 text-foreground"
			>
				Reset
			</button>
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

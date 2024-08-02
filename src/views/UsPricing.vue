<template>
	<div class="flex flex-col items-center pt-32 gap-8">
		<div class="flex flex-col items-center w-1/2 mb-16">
			<h1 class="text-size3xl uppercase mb-2">US Pricing</h1>
			<p class="text-center text-muted-foreground">
				Simply upload your current rates and the rates of your
				perspective carrier. We will perform a detailed analysis of the differences between the decks.
			</p>
		</div>
		<button
			@click="resetThisReport"
			v-if="report"
			class="btn btn-destructive mb-8"
		>
			Reset
		</button>

		<div class="flex items-center justify-center gap-8 flex-wrap">
			<UploadComponent
				typeOfComponent="owner"
				DBname="us"
				componentName="us1"
				:disabled="dbStore.isComponentDisabled('us1')"
			/>
			<UploadComponent
				typeOfComponent="client"
				DBname="us"
				componentName="us2"
				:disabled="dbStore.isComponentDisabled('us2')"
			/>
		</div>
		<div>
			<button
				@click="makeReport"
				:disabled="!dbStore.getIsUSfull"
				:class="{
					'bg-blue-500 hover:bg-blue-600 text-white':
						dbStore.getIsUSfull,
					'bg-gray-500 text-gray-300 cursor-not-allowed':
						!dbStore.getIsUSfull,
				}"
				class="py-2 px-4 rounded transition text-center"
			>
				Compare Files
			</button>
		</div>
		:: {{ dbStore.getUSFileNames }}<br />
		::{{ dbStore.getIsUSfull }}<br />
		:: {{ dbStore.isComponentDisabled('us1') }} ::
		{{ dbStore.isComponentDisabled('us2') }}
		<!-- <div v-else>
        <GenerateReport
          v-if="report"
          :report="report"
          :details="details"
        />
      </div> -->
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue';
	import UploadComponent from '../components/UploadComponent.vue';
	import GenerateReport from '../components/GenerateReport.vue';
	import { type ComparisonReport } from '../../types/app-types';
	import { makePricingReportApi, resetReportApi } from '@/API/api';
	import { useDBstate } from '@/stores/dbStore';

	const dbStore = useDBstate();

	const file1Loaded = ref<boolean>(false);
	const file2Loaded = ref<boolean>(false);

	const report = ref<ComparisonReport | null>(null);

	function handleFileProcessedEmit(fileName: string) {
		console.log('caught it', fileName);
		file1Loaded.value
			? (file1Loaded.value = true)
			: (file2Loaded.value = true);
	}

	async function resetThisReport() {
		//use API to delet DB by name
		await resetReportApi('us');
		//reset Pinia state
		dbStore.resetFilesUploadedByDBname('us');
		report.value = null;
	}

	// const file1 = ref<File | null>(null);
	// const file2 = ref<File | null>(null);

	// const isReporting = ref<boolean>(false);
	// const report = ref<ComparisonReport | null>(null);
	// const details = ref<{
	//   fileName1: string;
	//   fileName2: string;
	// } | null>(null);

	function makeReport() {
		//start the web worker to generate report
	}
</script>

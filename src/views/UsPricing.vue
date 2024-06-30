<template>
	<div class="flex flex-col items-center pt-32 gap-8">
		<h1 class="text-sizeLg">US Pricing</h1>

		<div class="flex items-center justify-center gap-8">
			<UploadComponent
				mssg="Upload YOUR rates as CSV"
				DBname="us"
				compName="us1"
				@fileProcessed="handleFileProcessedEmit"
				:class="{
					'bg-green-100': DBstore.USfilesUploaded.file1 !== '',
				}"
			/>
			<UploadComponent
				mssg="Upload CARRIER rates as CSV"
				DBname="us"
				compName="us2"
				@fileProcessed="handleFileProcessedEmit"
				:class="{
					'bg-green-100': DBstore.USfilesUploaded.file2 !== '',
				}"
			/>
		</div>
		<div>
			<button
				@click="makeReport"
				:disabled="DBstore.USfilesUploaded.fileCount !== 2"
				:class="{
					'bg-blue-500 hover:bg-blue-600 text-white':
						DBstore.USfilesUploaded.fileCount === 2,
					'bg-gray-500 text-gray-300 cursor-not-allowed':
						DBstore.USfilesUploaded.fileCount !== 2,
				}"
				class="py-2 px-4 rounded transition text-center"
			>
				Compare Files
			</button>
		</div>
		:: {{ DBstore.USfilesUploaded.fileCount }}<br />
		::{{ DBstore.USfilesUploaded.file1 }}<br />
		:: {{ DBstore.USfilesUploaded.file2 }}
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

	import { useDBstore } from '@/stores/db';

	const DBstore = useDBstore();

	const file1Loaded = ref<boolean>(false);
	const file2Loaded = ref<boolean>(false);

	function handleFileProcessedEmit(fileName: string) {
		console.log('caught it', fileName);
		file1Loaded.value
			? (file1Loaded.value = true)
			: (file2Loaded.value = true);
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

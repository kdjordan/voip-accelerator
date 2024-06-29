<template>
	<div>
		<h1 class="text-sizeLg">AZ Pricing</h1>
		<div class="mx-auto p-6 space-y-6 pt-32">
			<div class="flex flex-col gap-4">
				<UploadComponent
					mssg="<h2 class='text-sizeLg'>Upload YOUR rates as CSV.</h2><br /><br /> (You can drag and drop or click <span style='color:blue;'>here</span> to select from your computer.)"
					DBname="az"
          compName="az1"
					@fileProcessed="handleFileProcessedEmit"
					:class="{
						'bg-green-100': DBstore.AZfilesUploaded.file1 !== '',
					}"
				/>
				<UploadComponent
					mssg="<h2 class='text-sizeLg'>Upload CARRIER rates as CSV.</h2><br /><br /> (You can drag and drop or click <span style='color:blue;'>here</span> to select from your computer.)"
					DBname="az"
					compName="az2"
					@fileProcessed="handleFileProcessedEmit"
					:class="{
						'bg-green-100': DBstore.AZfilesUploaded.file2 !== '',
					}"
				/>

				<button
					v-if="DBstore.AZfilesUploaded.fileCount === 2"
					@click="makeReport"
					class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition text-center"
				>
					Compare Files
				</button>
				:: {{ DBstore.AZfilesUploaded.fileCount }}<br />
				::{{ DBstore.AZfilesUploaded.file1 }}<br />
				:: {{ DBstore.AZfilesUploaded.file2 }}
			</div>
			<!-- <div v-else>
        <GenerateReport
          v-if="report"
          :report="report"
          :details="details"
        />
      </div> -->
		</div>
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

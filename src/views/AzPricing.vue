<template>
	<div class="flex flex-col items-center pt-32 gap-8">
		<h1 class="text-sizeLg">AZ Pricing</h1>

		<div class="flex items-center justify-center gap-8 flex-wrap">
			<UploadComponent
				typeOfComponent="owner"
				DBname="az"
				componentName="az1"
				:disabled="DBstore.isComponentDisabled('az1')"
			/>

			<UploadComponent
				typeOfComponent="client"
				DBname="az"
				componentName="az2"
				:disabled="DBstore.isComponentDisabled('az2')"
			/>
		</div>
		<div>
		<!-- {{ DBstore.isComponentDisabled('az1') }} -->
		<!-- {{ DBstore }} -->
			<button
				@click="makeReport"
				:disabled="!DBstore.getIsAZfull"
				:class="{
					'bg-blue-500 hover:bg-blue-600 text-white':
						DBstore.getIsAZfull,
					'bg-gray-500 text-gray-300 cursor-not-allowed':
						!DBstore.getIsAZfull,
				}"
				class="py-2 px-4 rounded transition text-center"
			>
				Get Report
			</button>
		</div>
		<!-- file names::{{ DBstore.getAZFileNames }}<br />
		full::{{ DBstore.getIsAZfull }}<br />
		az1 disabled::{{ DBstore.isComponentDisabled('az1') }}<br />
		az2 disabled::{{ DBstore.isComponentDisabled('az2') }}<br />
		DBversion::{{ DBstore.globalDBVersion }}<br />
		File uploading::{{ DBstore.globalFileIsUploading}}<br /> -->
		<!-- <div v-if="report">
        <GenerateReport
          :report="report"
          :details="details"
        />
      </div> -->
	</div>
</template>

<script setup lang="ts">
	import UploadComponent from '../components/UploadComponent.vue';
	import ComparisonWorker from '@/workers/comparison.worker?worker';
	// import GenerateReport from '../components/GenerateReport.vue';
	// import { type ComparisonReport } from '../../types/app-types';
	import { useDBstate } from '@/stores/dbStore';
	const DBstore = useDBstate();
	


	// const isReporting = ref<boolean>(false);
	// const report = ref<ComparisonReport | null>(null);
	// const details = ref<{
	//   fileName1: string;
	//   fileName2: string;
	// } | null>(null);


	function makeReport() {
  const worker = new ComparisonWorker();

  // Assuming file1 and file2 are available from DBstore or another source
  const file1 = DBstore.getFile1Data();
  const file2 = DBstore.getFile2Data();

  // Post message to the worker
  worker.postMessage({ file1, file2 });

  // Handle worker messages
  worker.onmessage = (event) => {
    const comparisonReport = event.data;
    console.log('Comparison Report:', comparisonReport);
    // Update state or UI with the comparison report
  };

  // Handle errors from the worker
  worker.onerror = (error) => {
    console.error('Error from worker:', error);
    // Handle error condition
  };
}
</script>

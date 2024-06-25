<template>
	<TheHeader />
	<div class="mx-auto p-6 space-y-6 pt-32">
		<div v-if="!isReporting" class="flex flex-col gap-4">
			<UploadComponent
				mssg="Upload YOUR rates as CSV. <br /><br /> You can drag and drop or click <span style='color:blue;'>here</span> to select from your computer."
				v-if="file1 === null"
				@file-selected="handleFile1"
			/>
			<CompleteUpload
				v-if="file1 !== null"
				mssg="Your rates have been accepted"
			/>
			<UploadComponent
				mssg="Upload your CLIENT rates as CSV. <br /><br /> You can drag and drop or click <span style='color:blue;'>here</span> to select from your computer."
				v-if="file2 === null"
				@file-selected="handleFile2"
			/>
			<CompleteUpload
				v-if="file2 !== null"
				mssg="The carrier rates been accepted"
			/>
			<button
				v-if="filesReady"
				@click="compareFiles"
				class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition text-center"
			>
				Compare Files
			</button>
		</div>
		<div v-else>
			<GenerateReport
				v-if="report"
				:report="report"
				:details="details"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue';
	import UploadComponent from './components/UploadComponent.vue';
	import CompleteUpload from './components/CompleteUpload.vue';
	import GenerateReport from './components/GenerateReport.vue';
	import TheHeader from './components/TheHeader.vue';
	import {
		FileEmit,
		ComparisonReport,
		StandardizedData,
		RateComparison
	} from '@/types/app-types';

	import { data1, data2 } from './assets/test-values';

	const file1 = ref<FileEmit | null>(null);
	const file2 = ref<FileEmit | null>(null);

	const isReporting = ref<boolean>(false);

	const report = ref<ComparisonReport | null>(null);

	const details = ref<{
		fileName1: string;
		fileName2: string;
	} | null>(null);

	const filesReady = computed(
		() => file1.value !== null && file2.value !== null
	);

	function handleFile1(fileData: FileEmit) {
		console.log('got file 1', fileData);
		file1.value = fileData;
	}

	function handleFile2(fileData: FileEmit) {
		console.log('got file 2', fileData);
		file2.value = fileData;
	}

	function compareFiles() {
		isReporting.value = true;
		if (!filesReady.value) {
			alert('Please select both files');
			return;
		}

		const map1 = convertToMap(file1.value!.data);
		const map2 = convertToMap(file2.value!.data);

		const comparisonReport: ComparisonReport = {
			higherRatesForFile1: [],
			higherRatesForFile2: [],
			sameRates: {},
		};

		map1.forEach((file1Data, dialCode) => {
			const file2Data = map2.get(dialCode);
			if (file2Data) {
				const rate1 = file1Data.rate;
				const rate2 = file2Data.rate;

				if (rate1 > rate2) {
					comparisonReport.higherRatesForFile1.push({
						dialCode: dialCode,
						destName: file1Data.destName,
						rateFile1: rate1,
						rateFile2: rate2,
						percentageDifference: calculatePercentageDifference(
							rate1,
							rate2
						),
					});
				} else if (rate2 > rate1) {
					comparisonReport.higherRatesForFile2.push({
						dialCode: dialCode,
						destName: file1Data.destName,
						rateFile1: rate1,
						rateFile2: rate2,
						percentageDifference: calculatePercentageDifference(
							rate2,
							rate1
						),
					});
				} else {
					comparisonReport.sameRates[dialCode] = {
						destName: file1Data.destName,
						rateFile1: rate1,
						rateFile2: rate2,
					};
				}
			}
		});

		// Sort higherRatesForFile1 by percentageDifference descending
		comparisonReport.higherRatesForFile1.sort(
			(a: RateComparison, b: RateComparison) =>
				b.percentageDifference - a.percentageDifference
		);

		// Sort higherRatesForFile2 by percentageDifference descending
		comparisonReport.higherRatesForFile2.sort(
			(a: RateComparison, b: RateComparison) =>
				b.percentageDifference - a.percentageDifference
		);

		console.log(comparisonReport);
		report.value = comparisonReport;
		details.value = {
			fileName1: file1.value.file.name.split('.')[0],
			fileName2: file2.value.file.name.split('.')[0],
		};
	}
	function calculatePercentageDifference(
		rate1: number,
		rate2: number
	): number {
		return ((rate1 - rate2) / ((rate1 + rate2) / 2)) * 100;
	}

	function convertToMap(
		fileData: StandardizedData[]
	): Map<string, StandardizedData> {
		const dataMap = new Map<string, StandardizedData>();
		fileData.forEach((item) => {
			dataMap.set(item.dialCode, item);
		});
		return dataMap;
	}
</script>

<style>
	.container {
		max-width: 600px;
	}
</style>

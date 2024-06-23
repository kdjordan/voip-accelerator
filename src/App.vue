<template>
	<TheHeader />
	<div class="container mx-auto p-6 space-y-6">
		<UploadComponent
			v-if="file1 === null"
			@file-selected="handleFile1"
		/>
		<CompleteUpload
			v-if="file1 !== null"
			mssg="File 1 had been accepted"
		/>
		<UploadComponent
			v-if="file2 === null"
			@file-selected="handleFile2"
		/>
		<CompleteUpload
			v-if="file2 !== null"
			mssg="File 2 had been accepted"
		/>
		<button
			@click="compareFiles"
			class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
		>
			Compare Files
		</button>
		<!-- <ReportComponent v-if="comparisonResult.length" :results="comparisonResult" /> -->
	</div>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue';
	import UploadComponent from './components/UploadComponent.vue';
	import CompleteUpload from './components/CompleteUpload.vue';
	// import ReportComponent from './components/ReportComponent.vue';
	import TheHeader from './components/TheHeader.vue';

	interface StandardizedData {
		destName: string;
		dialCode: string;
		rate: number;
	}

	interface FileEmit {
		file: File;
		data: StandardizedData[];
	}

	interface ComparisonReport {
		higherRatesForFile1: {
			[destCode: string]: {
				dialCode: string;
				destName: string;
				rateFile1: number;
				rateFile2: number;
				percentageDifference: number;
			};
		};
		higherRatesForFile2: {
			[destCode: string]: {
				dialCode: string;
				destName: string;
				rateFile1: number;
				rateFile2: number;
				percentageDifference: number;
			};
		};
		sameRates: {
			[dialCode: string]: {
				destName: string;
				rateFile1: number;
				rateFile2: number;
			};
		};
	}

	const testData1 = [
		{ destName: 'Canada - MB', dialCode: '1204201', rate: 0.0032 },
		{ destName: 'Canada - MB', dialCode: '1204202', rate: 0.0033 },
		{ destName: 'Canada - MB', dialCode: '1204203', rate: 0.0028 },
		{ destName: 'Canada - MB', dialCode: '1204204', rate: 0.0146 },
		{ destName: 'Canada - MB', dialCode: '1204205', rate: 0.0035 },
		{ destName: 'Canada - MB', dialCode: '1204206', rate: 0.0029 },
		{ destName: 'Canada - MB', dialCode: '1204207', rate: 0.0048 },
		{ destName: 'Canada - MB', dialCode: '1204208', rate: 0.0024 },
		{ destName: 'Canada - MB', dialCode: '1204209', rate: 0.0028 },
		{ destName: 'Canada - MB', dialCode: '1204210', rate: 0.0027 },
	];

	const testData2 = [
		{ destName: 'Canada - MB', dialCode: '1204201', rate: 0.0042 },
		{ destName: 'Canada - MB', dialCode: '1204202', rate: 0.0043 },
		{ destName: 'Canada - MB', dialCode: '1204203', rate: 0.0048 },
		{ destName: 'Canada - MB', dialCode: '1204204', rate: 0.0146 },
		{ destName: 'Canada - MB', dialCode: '1204205', rate: 0.0045 },
		{ destName: 'Canada - MB', dialCode: '1204206', rate: 0.0049 },
		{ destName: 'Canada - MB', dialCode: '1204207', rate: 0.0048 },
		{ destName: 'Canada - MB', dialCode: '1204208', rate: 0.0044 },
		{ destName: 'Canada - MB', dialCode: '1204209', rate: 0.0048 },
		{ destName: 'Canada - MB', dialCode: '1204210', rate: 0.0047 },
	];

	const file1 = ref<FileEmit | null>(null);
	const file2 = ref<FileEmit | null>(null);

	const comparisonResult = ref<
		{
			dialCode: string;
			difference: number;
			direction: 'higher' | 'lower';
		}[]
	>([]);

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
		const map1 = convertToMap(testData1);
		const map2 = convertToMap(testData2);
		console.log('got this map for file1 ', map1);
		console.log('got this map for file2 ', map2);
		const report: ComparisonReport = {
			higherRatesForFile1: {},
			higherRatesForFile2: {},
			sameRates: {},
		};

		// Iterate over keys in map1 (or map2, since they should have the same keys)
		// Iterate over keys in map1 (or map2, since they should have the same keys)
    map1.forEach((file1Data, dialCode) => {
        const file2Data = map2.get(dialCode);
        if (file2Data) {
            const rate1 = file1Data.rate;
            const rate2 = file2Data.rate;

            // Determine which file has the higher rate
            if (rate1 > rate2) {
                // File 1 should buy from File 2
                report.higherRatesForFile1[dialCode] = {
                    dialCode: dialCode,
                    destName: file1Data.destName,
                    rateFile1: rate1,
                    rateFile2: rate2,
                    percentageDifference: calculatePercentageDifference(rate1, rate2)
                };
            } else if (rate2 > rate1) {
                // File 1 should sell to File 2
                report.higherRatesForFile2[dialCode] = {
                    dialCode: dialCode,
                    destName: file1Data.destName,
                    rateFile1: rate1,
                    rateFile2: rate2,
                    percentageDifference: calculatePercentageDifference(rate2, rate1)
                };
            } else {
                // Same rate for both files
                report.sameRates[dialCode] = {
                    destName: file1Data.destName,
                    rateFile1: rate1,
                    rateFile2: rate2
                };
            }
        }
    });
		console.log('the report is ', report)
    return report;
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

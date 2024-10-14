<template>
	<div class="flex flex-col items-center pt-8 h-full">
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
		<div class="report-content">
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
	import { ref, watch } from 'vue';
	import {
		AZColumnRole,
		DBName,
		type AZStandardizedData,
	} from '../../types/app-types';
	import AZFileUploads from '../components/AZFileUploads.vue';
	import CodeReportAZ from '../components/AZCodeReport.vue';
	import PricingReportAZ from '../components/AZPricingReport.vue';
	import useIndexedDB from '../composables/useIndexDB';
	import { makeAzReportsApi, resetReportApi } from '@/API/api';
	import { useDBstate } from '@/stores/dbStore';
	import { storeToRefs } from 'pinia';

	const dbStore = useDBstate();

	const { loadFromIndexedDB } = useIndexedDB();

	const theDb = ref<DBName>(DBName.AZ);
	const component1 = ref<string>('az1');
	const component2 = ref<string>('az2');
	const isGeneratingReports = ref<boolean>(false);
	// const showUploadComponents = ref<boolean>(true);

	const columnRoleOptions = [
		{ value: AZColumnRole.Destination, label: 'Destination Name' },
		{ value: AZColumnRole.DialCode, label: 'Dial Code' },
		{ value: AZColumnRole.Rate, label: 'Rate' },
	];

	const uploadedFiles = ref<Record<string, string>>({});

	watch(
		() => [dbStore.getAzPricingReport, dbStore.getAzCodeReport],
		([newPricing, newCode]) => {
			dbStore.setAzReportsGenerated(!!newPricing && !!newCode);
		},
		{ immediate: true }
	);

	async function handleFileUploaded(
		componentName: string,
		fileName: string
	) {
		uploadedFiles.value[componentName] = fileName;
		console.log(`File uploaded for ${componentName}: ${fileName}`);
	}

	async function generateReports() {
		isGeneratingReports.value = true;
		console.log('generateReports called');
		try {
			const fileName1 = dbStore
				.getStoreNameByComponent(component1.value)
				.split('.')[0];
			const fileName2 = dbStore
				.getStoreNameByComponent(component2.value)
				.split('.')[0];

			const file1Data = await getFilesFromIndexDB(
				theDb.value,
				dbStore.getStoreNameByComponent(component1.value),
				dbStore.globalDBVersion
			);
			const file2Data = await getFilesFromIndexDB(
				theDb.value,
				dbStore.getStoreNameByComponent(component2.value),
				dbStore.globalDBVersion
			);

			if (fileName1 && fileName2 && file1Data && file2Data) {
				console.log('generateReports: got file data');
				const {
					pricingReport: pricingReportData,
					codeReport: codeReportData,
				} = await makeAzReportsApi({
					fileName1,
					fileName2,
					file1Data: file1Data as AZStandardizedData[],
					file2Data: file2Data as AZStandardizedData[],
				});

				if (pricingReportData && codeReportData) {
					console.log('generateReports: got reports data', {
						pricingReportData,
						codeReportData,
					});
					dbStore.setAzPricingReport(pricingReportData);
					dbStore.setAzCodeReport(codeReportData);
					dbStore.setAzReportsGenerated(true);
					dbStore.setShowAzUploadComponents(false);
					console.log(
						'Reports set in store, showAzUploadComponents:',
						dbStore.showAzUploadComponents
					);
				} else {
					console.error('Error: Reports data is null or undefined');
				}
			} else {
				console.error('Error getting files from DB for reports');
			}
		} catch (error) {
			console.error('Error generating reports:', error);
		} finally {
			isGeneratingReports.value = false;
		}
	}

	async function getFilesFromIndexDB(
		dbName: DBName,
		store: string,
		dbVersion: number
	) {
		try {
			const result = await loadFromIndexedDB(
				dbName,
				store,
				dbVersion
			);
			return result;
		} catch (e) {
			isGeneratingReports.value = false;
			console.error(`got an error getting ${store} out of DB`);
		}
	}

	async function handleReset() {
		console.log('Resetting the AZ report');
		dbStore.setActiveReportAZ('files');
		await resetReportApi('az');
	}
</script>

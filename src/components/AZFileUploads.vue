<template>
	<div
		class="bg-background rounded-lg m-auto p-6 w-full max-w-4xl flex flex-col items-center"
	>
		<div class="mb-10 text-center">
			<h1
				class="text-5xl font-bold text-foreground uppercase inline-block mb-8"
			>
				AZ PRICING
			</h1>
			<p class="text-muted-foreground w-4/5 mx-auto">
				Upload
				<span class="font-bold uppercase text-accent">your</span>
				current rates and the rates of your
				<span class="font-bold uppercase text-accent"
					>prospective carrier.</span
				>
				We will generate you a report showing the best opportunities
				for you to buy and sell.
			</p>
		</div>
		<div class="flex flex-col w-full bg-muted p-6 rounded-xl">
			<div class="flex justify-center space-x-6 flex-grow h-full">
				<UploadComponent
					typeOfComponent="owner"
					:DBname="DBName.AZ"
					:componentName="component1"
					:disabled="dbStore.isComponentDisabled('az1')"
					:columnRoleOptions="columnRoleOptions"
					class="flex-1 flex flex-col"
					@fileUploaded="handleFileUploaded"
				/>

				<UploadComponent
					typeOfComponent="client"
					:DBname="DBName.AZ"
					:componentName="component2"
					:disabled="dbStore.isComponentDisabled('az2')"
					:columnRoleOptions="columnRoleOptions"
					class="flex-1 flex flex-col"
					@fileUploaded="handleFileUploaded"
				/>
			</div>
			<div class="mt-6 flex justify-center items-center">
				<button v-if="!dbStore.getAzReportsGenerated"
					@click="handleReportsAction"
					:disabled="!dbStore.getIsAZfull || isGeneratingReports"
					:class="{
						'bg-blue-500 hover:bg-blue-600 text-white':
							dbStore.getIsAZfull && !isGeneratingReports,
						'bg-gray-500 text-gray-300 cursor-not-allowed':
							!dbStore.getIsAZfull || isGeneratingReports,
						pulse: isGeneratingReports,
					}"
					class="btn font-bold py-2 px-4 rounded-lg shadow-md"
				>
					<span v-if="isGeneratingReports">GENERATING REPORTS</span>
					<span v-else>Get Reports</span>
				</button>
			</div>
			<!-- Debug info -->
			<div class="mt-4 text-sm text-gray-500">
				Reports generated: {{ dbStore.getAzReportsGenerated }}
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
	import UploadComponent from '../components/UploadComponent.vue';
	import ReportDisplay from '../components/ReportDisplay.vue';
	import useIndexedDB from '../composables/useIndexDB';
	import { makeAzReportsApi, resetReportApi } from '@/API/api';
	import { useDBstate } from '@/stores/dbStore';
	import { storeToRefs } from 'pinia';

	const dbStore = useDBstate();
	const {
		showAzUploadComponents,
		getAzCodeReport,
		getAzPricingReport,
	} = storeToRefs(dbStore);
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

	async function resetThisReport() {
		console.log('resetting the report');
		await resetReportApi('az');
		dbStore.setShowAzUploadComponents(true);
	}

	function handleGotoFiles() {
		dbStore.setShowAzUploadComponents(true);
	}

	async function handleReportsAction() {
		// console.log('handleReportsAction called, reportsGenerated:', dbStore.getAzReportsGenerated);
		if (dbStore.getAzReportsGenerated) {
			dbStore.setShowAzUploadComponents(false);
		} else {
			await generateReports();
		}
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
</script>

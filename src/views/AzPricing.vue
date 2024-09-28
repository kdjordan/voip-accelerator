<template>
	<div class="flex flex-col items-center pt-8 h-full">
		<div
			v-if="dbStore.showAzUploadComponents"
			class="flex flex-col items-center w-2/3 mb-16 rounded-xl shadow-xl bg-muted py-8 justify-center"
		>
			<h1
				class="text-size3xl uppercase mb-2 font-bold tracking-widest"
			>
				AZ Pricing
			</h1>
			<p class="text-center text-muted-foreground w-4/5">
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
		<div v-if="dbStore.showAzUploadComponents" class="flex flex-col w-2/3 bg-muted p-6 rounded-xl h-[calc(100vh-70%)]">
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
				<div
					v-if="isGeneratingReports"
					class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md cursor-pointer pulse"
				>
					<p>GENERATING REPORTS</p>
				</div>
				<button
					v-else
					@click="handleReportsAction"
					:disabled="!dbStore.getIsAZfull"
					:class="{
						'bg-blue-500 hover:bg-blue-600 text-white':
							dbStore.getIsAZfull,
						'bg-gray-500 text-gray-300 cursor-not-allowed':
							!dbStore.getIsAZfull,
					}"
					class="btn"
				>
					{{ dbStore.getAzReportsGenerated ? 'Goto Reports' : 'Get Reports' }}
				</button>
			</div>
			<!-- Debug info -->
			<div class="mt-4 text-sm text-gray-500">
				Reports generated: {{ dbStore.getAzReportsGenerated }}
			</div>
		</div>
		<ReportDisplay 
			v-else
			:codeReport="dbStore.getAzCodeReport"
			:pricingReport="dbStore.getAzPricingReport"
			@resetReport="resetThisReport"
			@gotoFiles="handleGotoFiles"
		/>
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
	import {
		makeAzReportsApi,
		resetReportApi,

	} from '@/API/api';
	import { useDBstate } from '@/stores/dbStore';

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

	watch(() => [dbStore.getAzPricingReport, dbStore.getAzCodeReport], ([newPricing, newCode]) => {
		dbStore.setAzReportsGenerated(!!newPricing && !!newCode);
		console.log('Reports updated:', { pricing: !!newPricing, code: !!newCode, generated: dbStore.getAzReportsGenerated });
	}, { immediate: true });

	async function handleFileUploaded(componentName: string, fileName: string) {
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
		console.log('handleReportsAction called, reportsGenerated:', dbStore.getAzReportsGenerated);
		if (dbStore.getAzReportsGenerated) {
			dbStore.setShowAzUploadComponents(false);
		} else {
			await generateReports();
		}
	}

	async function generateReports() {
		isGeneratingReports.value = true;
		try {
			const fileName1 = dbStore.getStoreNameByComponent(component1.value).split('.')[0];
			const fileName2 = dbStore.getStoreNameByComponent(component2.value).split('.')[0];

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
				console.log('Generating reports...');
				const { pricingReport: pricingReportData, codeReport: codeReportData } = await makeAzReportsApi({
					fileName1,
					fileName2,
					file1Data: file1Data as AZStandardizedData[],
					file2Data: file2Data as AZStandardizedData[],
				});
				
				if (pricingReportData && codeReportData) {
					dbStore.setAzPricingReport(pricingReportData);
					dbStore.setAzCodeReport(codeReportData);
					dbStore.setAzReportsGenerated(true);
					dbStore.setShowAzUploadComponents(false);
					console.log('Reports generated:', { pricing: !!pricingReportData, code: !!codeReportData, generated: dbStore.getAzReportsGenerated });
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
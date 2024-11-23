<template>
	<div
		class="flex flex-col items-center w-full"
		id="az-file-uploads"
	>
		<div class="mb-4 text-center">
			<h1 class="text-3xl mb-2 text-white inline-block">
				{{!dbStore.getIsAZfull ? 'A-Z Pricing' : 'FILES UPLOADED'}}
			</h1>
			<p v-if="!dbStore.getIsAZfull" class="text-center text-sizeBase max-w-2xl text-foreground mb-8">
				Upload
				<span class="uppercase">your</span>
				current rates and the rates of your
				<span class="uppercase">prospective carrier.</span>
				<br />
				We will generate you a report showing the best opportunities
				for you to buy and sell.
			</p>
		</div>

		<div class="w-full max-w-2xl">
			<div class="grid grid-cols-2 gap-8">
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

			<div class="text-center">
				<button 
					v-if="!dbStore.getAzReportsGenerated"
					@click="handleReportsAction"
					:disabled="!dbStore.getIsAZfull || isGeneratingReports"
					:class="[
						'btn-secondary btn-lg',
						isGeneratingReports && 'animate-pulse'
					]"
				>
					{{ isGeneratingReports ? 'GENERATING REPORTS' : 'Get Reports' }}
				</button>
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
	import useIndexedDB from '../composables/useIndexDB';
	import { makeAzReportsApi, resetReportApi } from '@/API/api';
	import { useDBstate } from '@/stores/dbStore';

	const dbStore = useDBstate();
	const { loadFromIndexedDB } = useIndexedDB();

	const theDb = ref<DBName>(DBName.AZ);
	const component1 = ref<string>('az1');
	const component2 = ref<string>('az2');
	const isGeneratingReports = ref<boolean>(false);

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

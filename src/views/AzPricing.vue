<template>
	<div class="flex flex-col items-center pt-8 h-full">
		<div
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
		<div v-if="showUploadComponents" class="flex flex-col w-2/3 bg-muted p-6 rounded-xl h-[calc(100vh-70%)]">
			<div class="flex justify-center space-x-6 flex-grow h-full">
				<UploadComponent
					typeOfComponent="owner"
					:DBname="DBName.AZ"
					:componentName="component1"
					:disabled="dbStore.isComponentDisabled('az1')"
					:columnRoleOptions="columnRoleOptions"
					class="flex-1 flex flex-col"
				/>

				<UploadComponent
					typeOfComponent="client"
					:DBname="DBName.AZ"
					:componentName="component2"
					:disabled="dbStore.isComponentDisabled('az2')"
					:columnRoleOptions="columnRoleOptions"
					class="flex-1 flex flex-col"
				/>
			</div>
			<div class="mt-6 flex justify-center items-center">
				<!-- Changed from justify-end to justify-center -->
				<div
					v-if="isGeneratingReports"
					class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md cursor-pointer pulse"
				>
					<p>GENERATING REPORTS</p>
				</div>
				<button
					v-else
					@click="generateReports"
					:disabled="!dbStore.getIsAZfull"
					:class="{
						'bg-blue-500 hover:bg-blue-600 text-white':
							dbStore.getIsAZfull,
						'bg-gray-500 text-gray-300 cursor-not-allowed':
							!dbStore.getIsAZfull,
					}"
					class="btn"
				>
					Get Reports
				</button>
			</div>
		</div>
		<ReportDisplay 
			v-else
			:codeReport="codeReport"
			:pricingReport="pricingReport"
      @resetReport="resetThisReport"
      @gotoFiles="handleGotoFiles"
		/>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue';
	import {
		type AzPricingReport,
		AZColumnRole,
		DBName,
		type AZStandardizedData,
		type AzCodeReport,
	} from '../../types/app-types';
	import UploadComponent from '../components/UploadComponent.vue';
	import ReportDisplay from '../components/ReportDisplay.vue';
	import useIndexedDB from '../composables/useIndexDB';
	import {
		makeAzPricingReportApi,
		resetReportApi,
		makeAzCodeReportApi,
	} from '@/API/api';
	import { useDBstate } from '@/stores/dbStore';

	const dbStore = useDBstate();
	const { loadFromIndexedDB } = useIndexedDB();

	const theDb = ref<DBName>(DBName.AZ);
	const component1 = ref<string>('az1');
	const component2 = ref<string>('az2');
	const isGeneratingReports = ref<boolean>(false);
	const pricingReport = ref<AzPricingReport | null>(null);
	const codeReport = ref<AzCodeReport | null>(null);
	const showUploadComponents = ref<boolean>(true);

	const columnRoleOptions = [
		{ value: AZColumnRole.Destination, label: 'Destination Name' },
		{ value: AZColumnRole.DialCode, label: 'Dial Code' },
		{ value: AZColumnRole.Rate, label: 'Rate' },
	];

	async function resetThisReport() {
    console.log('resetting the report');
		await resetReportApi('az');
		dbStore.resetFilesUploadedByDBname(DBName.AZ);
		pricingReport.value = null;
		codeReport.value = null;
		showUploadComponents.value = true;
	}

	function handleGotoFiles() {
		showUploadComponents.value = true;
		pricingReport.value = null;
		codeReport.value = null;
	}

	async function makePricingReport() {
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
			console.log('starting the pricing report...');
			const returnedReport = await makeAzPricingReportApi({
				fileName1,
				fileName2,
				file1Data: file1Data as AZStandardizedData[],
				file2Data: file2Data as AZStandardizedData[],
			});
			console.log('got pricing report ', returnedReport);
			pricingReport.value = returnedReport;
		} else {
			console.error('Error getting files from DB for pricing report');
		}
	}

	async function makeCodeReport() {
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
			console.log('starting the code report...');
			const returnedCodeReport = await makeAzCodeReportApi({
				fileName1,
				fileName2,
				file1Data: file1Data as AZStandardizedData[],
				file2Data: file2Data as AZStandardizedData[],
			});
			console.log('got code report ', returnedCodeReport);
			codeReport.value = returnedCodeReport;
		} else {
			console.error('Error getting files from DB for code report');
		}
	}

	async function generateReports() {
		isGeneratingReports.value = true;
		try {
			await makeCodeReport();
			await makePricingReport();
			showUploadComponents.value = false;
		} catch (error) {
			console.error('Error generating reports:', error);
			// Handle error (e.g., show error message to user)
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

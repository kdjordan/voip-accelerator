<template>
	<div class="flex flex-col items-center pt-8 h-full">
		<div class="flex flex-col items-center w-2/3 mb-16 rounded-xl shadow-xl bg-muted py-8 justify-center">
			<h1 class="text-size3xl uppercase mb-2 font-bold tracking-widest">US Pricing</h1>
			<p class="text-center text-muted-foreground w-4/5">
				Upload <span class="font-bold uppercase text-accent">your</span> current rates and the rates of your <span class="font-bold uppercase text-accent">prospective carrier.</span> We will generate you a report showing the best opportunities for you to buy and sell.
			</p>
		</div>
		<div v-if="!report" class="flex flex-col w-2/3 bg-muted p-6 rounded-xl h-[calc(100vh-70%)]">
			<div class="flex justify-center space-x-6 flex-grow h-full">
				<UploadComponent
					typeOfComponent="owner"
					:DBname="DBName.US"
					:componentName="component1"
					:disabled="dbStore.isComponentDisabled('us1')"
					:columnRoleOptions="columnRoleOptions"
					class="flex-1 flex flex-col"
				/>
				<UploadComponent
					typeOfComponent="client"
					:DBname="DBName.US"
					:componentName="component2"
					:disabled="dbStore.isComponentDisabled('us2')"
					:columnRoleOptions="columnRoleOptions"
					class="flex-1 flex flex-col"
				/>
			</div>
			<div class="text-center mt-6">
				<div
					v-if="isGeneratingReport"
					class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md cursor-pointer pulse"
				>
					<p>GENERATING REPORT</p>
				</div>
				<button
					v-if="!isGeneratingReport"
					
					@click="console.log('make US report')"
					:disabled="!dbStore.getIsUSfull"
					:class="{
						'bg-blue-500 hover:bg-blue-600 text-white':
							dbStore.getIsUSfull,
						'bg-gray-500 text-gray-300 cursor-not-allowed':
							!dbStore.getIsUSfull,
					}"
					class="btn"
				>
					Get Report
				</button>
			</div>
		</div>
		<div v-if="report" class="w-full mt-8">
			<!-- <GenerateReport :report="report" @resetReport="resetThisReport" /> -->
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue';
	import { DBName } from '../../types/app-types';
	import UploadComponent from '../components/UploadComponent.vue';
	import GenerateReport from '../components/GenerateReport.vue';
	import useIndexedDB from '../composables/useIndexDB';
	import { resetReportApi } from '@/API/api';
	import { useDBstate } from '@/stores/dbStore';

	const dbStore = useDBstate();
	const { loadFromIndexedDB } = useIndexedDB();

	const theDb = ref<DBName>(DBName.US);
	const component1 = ref<string>('us1');
	const component2 = ref<string>('us2');
	const isGeneratingReport = ref<boolean>(false);
	// const report = ref<ComparisonReport | null>(null);
	const report = ref<String>('')

	const columnRoleOptions =  [
		{ value: 'NPANXX', label: 'NPANXX' },
		{ value: 'NPA', label: 'NPA' },
		{ value: 'NXX', label: 'NXX' },
		{ value: 'inter', label: 'InterState Rate' },
		{ value: 'intra', label: 'IntraState Rate' },
		{ value: 'indeterm', label: 'Indeterminate Rate' },
	];

	async function resetThisReport() {
		await resetReportApi('us');
		dbStore.resetFilesUploadedByDBname(DBName.US);
		// report.value = null;
	}

	// async function makeReport() {
	// 	isGeneratingReport.value = true;

	// 	const fileName1 = dbStore.getStoreNameByComponent(component1.value).split('.')[0];
	// 	const fileName2 = dbStore.getStoreNameByComponent(component2.value).split('.')[0];

	// 	const file1Data = await getFilesFromIndexDB(theDb.value, dbStore.getStoreNameByComponent(component1.value), dbStore.globalDBVersion);
	// 	const file2Data = await getFilesFromIndexDB(theDb.value, dbStore.getStoreNameByComponent(component2.value), dbStore.globalDBVersion);

	// 	if (fileName1 && fileName2 && file1Data && file2Data) {
	// 		console.log('starting the report...');
	// 		const returnedReport = await makePricingReportApi({
	// 			fileName1,
	// 			fileName2,
	// 			file1Data,
	// 			file2Data,
	// 		});
	// 		console.log('got report ', returnedReport);
	// 		report.value = returnedReport;
	// 		isGeneratingReport.value = false;
	// 	} else {
	// 		isGeneratingReport.value = false;
	// 		console.error('Error getting files from DB');
	// 	}
	// }

	async function getFilesFromIndexDB(dbName: string, store: string, dbVersion: number) {
		try {
			const result = await loadFromIndexedDB(dbName, store, dbVersion);
			return result;
		} catch (e) {
			isGeneratingReport.value = false;
			console.error(`got an error getting ${store} out of DB`);
		}
	}
</script>

<template>
	<div class="flex flex-col items-center w-full max-w-5xl min-h-[400px]">
		<div class="flex flex-col items-center w-full mb-8">
			<h1 class="text-3xl mb-2  text-white">
				US Pricing
			</h1>
			<p class="text-center text-sizeBase max-w-2xl text-foreground">
				Upload YOUR current rates and the rates of your PROSPECTIVE CARRIER.
				We will generate you a report showing the best opportunities
				for you to buy and sell.
			</p>
		</div>
		<div v-if="!report" class="w-full max-w-2xl grid grid-cols-2 gap-8 rounded-xl mt-4">
			<UploadComponent
				typeOfComponent="owner"
				:DBname="DBName.US"
				:componentName="component1"
				:disabled="dbStore.isComponentDisabled('us1')"
				:columnRoleOptions="columnRoleOptions"
			/>
			<UploadComponent
				typeOfComponent="client"
				:DBname="DBName.US"
				:componentName="component2"
				:disabled="dbStore.isComponentDisabled('us2')"
				:columnRoleOptions="columnRoleOptions"
			/>
		</div>
		<div class="text-center">
			<div
				v-if="isGeneratingReport"
				class="bg-white/10 text-foreground py-3 px-6 rounded-lg cursor-pointer pulse"
			>
				<p>GENERATING REPORT</p>
			</div>
			<button
				v-if="!isGeneratingReport"
				@click="console.log('make US report')"
				:disabled="!dbStore.getIsUSfull"
				:class="{
					'bg-white/10 hover:bg-white/20 text-foreground': dbStore.getIsUSfull,
					'bg-muted/50 text-foreground/50 cursor-not-allowed': !dbStore.getIsUSfull,
				}"
				class="py-3 px-6 rounded-lg transition-colors"
			>
				Get Reports
			</button>
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
	import GenerateReport from '../components/AZPricingReport.vue';
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
	const report = ref<String>('');

	const columnRoleOptions = [
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

	async function getFilesFromIndexDB(
		dbName: string,
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
			isGeneratingReport.value = false;
			console.error(`got an error getting ${store} out of DB`);
		}
	}
</script>

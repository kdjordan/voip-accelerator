<template>
	<div class="flex flex-col items-center pt-32 gap-8">
		<h1 class="text-size2xl uppercase">AZ Pricing</h1>
		<button
			@click="resetThisReport"
			v-if="report"
			class="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition ml-4"
		>
			RESET
		</button>

		<div
			v-if="!report"
			class="flex items-center justify-center gap-8 flex-wrap"
		>
			<UploadComponent
				typeOfComponent="owner"
				:DBname="theDb"
				:componentName="component1"
				:disabled="dbStore.isComponentDisabled('az1')"
			/>

			<UploadComponent
				typeOfComponent="client"
				DBname="az"
				:componentName="component2"
				:disabled="dbStore.isComponentDisabled('az2')"
			/>
		</div>
		<div>
			<div
				v-if="isGeneratingReport"
				class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md cursor-pointer pulse"
			>
				<p class="text-center">GERERATING REPORT</p>
			</div>
			<button
				v-if="!isGeneratingReport && !report"
				@click="makeReport"
				:disabled="!dbStore.getIsAZfull"
				:class="{
					'bg-blue-500 hover:bg-blue-600 text-white':
						dbStore.getIsAZfull,
					'bg-gray-500 text-gray-300 cursor-not-allowed':
						!dbStore.getIsAZfull,
				}"
				class="py-2 px-4 rounded transition text-center"
			>
				Get Report
			</button>
		</div>
		<div>
			<GenerateReport
				v-if="report"
				:report="report"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue';
	import { type ComparisonReport } from '../../types/app-types';
	import UploadComponent from '../components/UploadComponent.vue';
	import GenerateReport from '../components/GenerateReport.vue';
	import useIndexedDB from '../composables/useIndexDB';
	import { makePricingReportApi, resetReportApi } from '@/API/api';
	const { loadFromIndexedDB } = useIndexedDB();
	import { useDBstate } from '@/stores/dbStore';
	
	const dbStore = useDBstate();

	const theDb = ref<string>('az');
	const component1 = ref<string>('az1');
	const component2 = ref<string>('az2');
	// const file1 = ref<string>(dbStore.getStoreNameByComponent(component1.value).split('.')[0])
	// const file2 = ref<string>(dbStore.getStoreNameByComponent(component2.value).split('.')[0])
	const fileName1 = ref<string>('')
	const fileName2 = ref<string>('')
	const isGeneratingReport = ref<boolean>(false);
	const report = ref<ComparisonReport | null>(null);

	async function resetThisReport() {
		//use API to delet DB by name
		await resetReportApi('az');
		//reset Pinia state
		dbStore.resetFilesUploadedByDBname('az')
		report.value = null;
	}

	async function makeReport() {
		isGeneratingReport.value = true;
		let fileName1 = dbStore.getStoreNameByComponent(component1.value).split('.')[0]
		let fileName2 = dbStore.getStoreNameByComponent(component2.value).split('.')[0]
		
		let file1Data = await getFilesFromIndexDB(theDb.value, dbStore.getStoreNameByComponent(component1.value), dbStore.globalDBVersion)
		let file2Data = await getFilesFromIndexDB(theDb.value, dbStore.getStoreNameByComponent(component2.value), dbStore.globalDBVersion)
		
		if (fileName1 && fileName2 && file1Data && file2Data) {
			console.log('starting the report...');
			const returnedReport = await makePricingReportApi({
				fileName1,
				fileName2,
				file1Data,
				file2Data
			})
			console.log('got report ',  returnedReport)
			report.value = returnedReport
			isGeneratingReport.value = false;
		} else {
			isGeneratingReport.value = false;
			console.error('Error getting files from DB')
		}

	}
	
	async function getFilesFromIndexDB(dbName: string, store: string, dbVersion: number) {
		try {
			const result = await loadFromIndexedDB(dbName, store, dbVersion)
			return result
		} catch(e) {
			isGeneratingReport.value = false;
			console.error(`got an errror getting ${store} out of DB`)
		}
	}
</script>

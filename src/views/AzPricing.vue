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
				:details="{ fileName1: 'file.csv', fileName2: 'file2.csv' }"
			/>
		</div>
		{{ dbStore }}
	</div>
</template>

<script setup lang="ts">
	import UploadComponent from '../components/UploadComponent.vue';
	import GenerateReport from '../components/GenerateReport.vue';
	import { type ComparisonReport } from '../../types/app-types';
	import useIndexedDB from '../composables/useIndexDB';
	import { makePricingReport, resetReport } from '@/API/api';
	const { loadFromIndexedDB } = useIndexedDB();
	import { useDBstate } from '@/stores/dbStore';
	import { ref } from 'vue';
	
	const dbStore = useDBstate();

	const theDb = ref<string>('az');
	const component1 = ref<string>('az1');
	const component2 = ref<string>('az2');
	const isGeneratingReport = ref<boolean>(false);

	// const isReporting = ref<boolean>(false);
	const report = ref<ComparisonReport | null>(null);

	async function resetThisReport() {
		await resetReport('az');
		dbStore.resetFilesUploadedByDBname('az')
		report.value = null;
	}

	async function makeReport() {
		console.log('going in');
		isGeneratingReport.value = true;
		let dbVersion = dbStore.globalDBVersion
		let dbName = theDb.value
		let file1 = await getFilesFromIndexDB(dbName, dbStore.getStoreNameByComponent(component1.value), dbVersion)
		let file2 = await getFilesFromIndexDB(dbName, dbStore.getStoreNameByComponent(component2.value), dbVersion)

		const returnedReport = await makePricingReport(file1, file2)
		report.value = returnedReport
		isGeneratingReport.value = false;

	}
	async function getFilesFromIndexDB(dbName: string, store: string, dbVersion: number) {
		try {
			const result = await loadFromIndexedDB(dbName, store, dbVersion)
			return result
		} catch(e) {
			console.log(`got an errror getting ${store}`)
		}
	}
</script>

<template>
	<div>
		<!-- Drop zone for file upload -->
		<div
			class="drop-zone border-2 border-dashed border-gray-300 p-6 text-center cursor-pointer rounded hover:border-gray-500 transition relative"
			@dragover.prevent="onDragOver"
			@drop.prevent="onDrop"
			@dragenter="onDragEnter"
			@dragleave="onDragLeave"
			:class="{
				'border-gray-500': isDragOver,
				loaded: loaded,
				'no-hover': DBstate.globalIsAfileUploading,
				'bg-green-100': DBloaded,
			}"
			@click="selectFile"
		>
			<div v-if="!DBloading" v-html="displayMessage"></div>
			<input
				type="file"
				@change="handleFileUpload"
				accept=".csv"
				hidden
				:disabled="DBstate.globalIsAfileUploading"
				ref="fileInput"
			/>
			<!-- Progress overlay -->
			<div v-if="DBloading">
				<div class="spinner"></div>
			</div>
		</div>

		<!-- Column Roles Modal -->
		<TheModal
			v-if="showModal"
			:showModal="showModal"
			:columns="columns"
			:previewData="previewData"
			:columnRoles="columnRoles"
			:startLine="startLine"
			@confirm="confirmColumnRoles"
			@cancel="cancelModal"
		/>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue';
	import Papa from 'papaparse';
	import { useIndexedDB } from '../composables/useIndexDB';
	import {
		type StandardizedData,
		type ParsedResults,
	} from '../../types/app-types';
	
	import TheModal from './TheModal.vue';

	const file = ref<File | null>(null);
	const fileInput = ref<HTMLInputElement | null>(null);
	const columns = ref<string[]>([]);
	const previewData = ref<string[][]>([]);
	const columnRoles = ref<string[]>([]);
	const isDragOver = ref<boolean>(false);
	const showModal = ref<boolean>(false);
	const startLine = ref<number>(1);
	const loaded = ref<boolean>(false);
	const progress = ref<number>(0);
	const successMessage = '<p>We Got it. Nice.</p>';

	const props = defineProps<{
		mssg: string;
		DBname: string;
	}>();

	const emit = defineEmits(['fileProcessed']);

	const { storeInIndexedDB, DBloading, DBloaded, DBstate } =
		useIndexedDB();

	const displayMessage = computed(() => {
		return DBloaded.value ? successMessage : props.mssg;
	});

	function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement | null;
		if (target && target.files) {
			const uploadedFile = target.files[0];
			if (uploadedFile) {
				file.value = uploadedFile;
				parseCSVForPreview(uploadedFile);
			}
		}
	}

	function onDrop(event: DragEvent) {
		const uploadedFile = event.dataTransfer?.files[0] ?? null;
		if (uploadedFile) {
			file.value = uploadedFile;
			parseCSVForPreview(uploadedFile);
		}
		isDragOver.value = false;
	}

	function onDragOver(event: DragEvent) {
		if (!DBstate.globalIsAfileUploading) {
			isDragOver.value = false;
		}
	}

	function onDragEnter(event: DragEvent) {
		if (!DBstate.globalIsAfileUploading) {
			isDragOver.value = true;
		}
	}

	function onDragLeave(event: DragEvent) {
		if (!DBstate.globalIsAfileUploading) {
			isDragOver.value = false;
		}
	}

	function parseCSVForPreview(uploadedFile: File) {
		Papa.parse(uploadedFile, {
			header: false,
			complete(results) {
				previewData.value = results.data.slice(0, 25) as string[][];
				columns.value = results.data[startLine.value - 1] as string[];
				columnRoles.value = Array(columns.value.length).fill('');
				showModal.value = true;
			},
		});
	}

	function confirmColumnRoles() {
		parseCSVForFullProcessing();
		showModal.value = false;
	}

	function cancelModal() {
		showModal.value = false;
	}

	function selectFile(): void {
		if (!DBstate.globalIsAfileUploading) {
			const input = fileInput.value;
			if (input) {
				input.click();
			}
		}
	}

	async function parseCSVForFullProcessing() {
		progress.value = 0; // Reset progress
		if (file.value) {
			Papa.parse(file.value, {
				header: false,
				fastMode: true,
				skipEmptyLines: true,
				complete(results: ParsedResults) {
					const dataStartIndex = startLine.value - 1;
					const fullData = results.data.slice(dataStartIndex);
					const standardizedData: {
						[key: string]: string | number;
					}[] = [];

					fullData.forEach((row: string[]) => {
						const standardizedRow: {
							[key: string]: string | number;
						} = {};
						columnRoles.value.forEach((role, index) => {
							if (role) {
								standardizedRow[role] =
									role === 'rate'
										? parseFloat(row[index])
										: row[index];
							}
						});
						standardizedData.push(standardizedRow);
					});

					storeDataInIndexedDB(standardizedData);
				},
			});
		}
	}

	async function storeDataInIndexedDB(
		data: { [key: string]: string | number }[]
	) {
		try {
			if (file.value) {
				const standardizedData: StandardizedData[] = data.map(
					(row) => ({
						destName: row.destName as string,
						dialCode: row.dialCode as string,
						rate: row.rate as number,
						// Add more properties as needed
					})
				);

				await storeInIndexedDB(
					standardizedData,
					props.DBname,
					file.value.name.split('.')[0]
				);
			}
		} catch (error) {
			console.error('Error storing data in IndexedDB:', error);
		}
		emit('fileProcessed');
	}
</script>

<style scoped>
	.drop-zone {
		position: relative;
		overflow: hidden;
	}
	.drop-zone .absolute {
		transition: width 0.3s ease-in-out;
	}
	.drop-zone.no-hover:hover {
		border-color: inherit; /* Disable hover effect */
		cursor: not-allowed; /* Optionally change the cursor to indicate disabled state */
	}
	.spinner {
		border: 4px solid rgba(0, 0, 0, 0.1);
		border-left-color: #fff;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>

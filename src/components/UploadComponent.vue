<template>
	<div class="min-w-[300px] max-w-md rounded">
		<div
			class="px-6 rounded-lg shadow-md flex flex-col items-center justify-center space-y-4 h-96"
		>
			<UploadIcon class="w-8 h-8 text-primary" />
			<p class="text-muted-foreground">{{ displayMessage }}</p>
			<div
				:class="[
					'w-[95%] h-32 border-2 border-primary rounded-md flex items-center justify-center text-primary hover:bg-primary/10 transition-colors',
					{ pulse: false, 'bg-stone-300': props.disabled },
				]"
				@dragover.prevent="onDragOver"
				@drop.prevent="onDrop"
				@dragenter="onDragEnter"
				@dragleave="onDragLeave"
				@click="selectFile"
				
			>
				<p>{{ statusMessage }}</p>
				<p>{{ props.disabled }}</p>

				<input
					type="file"
					@change="handleFileUpload"
					accept=".csv"
					hidden
					:disabled="props.disabled"
					ref="fileInput"
				/>
			</div>
			<DeleteButton
				v-if="DBstore.isComponentDisabled(props.componentName)"
				@click="removeFromDB"
			/>
			data: {{ previewData }}<br />
			cols: {{ columns }}<br />
			colroles: {{ columnRoles }}<br />
			file: {{ fileInput }} 
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
	<!-- {{ DBstore.AZfilesUploaded.file1 }}
	{{ props.compName }} -->
	<!-- {{ file.name }} -->
</template>

<script setup lang="ts">
	import TheModal from './TheModal.vue';
	import UploadIcon from './UploadIcon.vue';
	import DeleteButton from './DeleteButton.vue';
	import { ref, computed, watch } from 'vue';
	import Papa from 'papaparse';
	import { useIndexedDB } from '../composables/useIndexDB';
	import {
		type StandardizedData,
		type ParsedResults,
	} from '../../types/app-types';
	import { useDBstore } from '@/stores/db';

	const DBstore = useDBstore();
	const { storeInIndexedDB, deleteObjectStore } = useIndexedDB();
	const file = ref<File | null>(null);
	const fileInput = ref<HTMLInputElement | null>(null);
	const columns = ref<string[]>([]);
	const previewData = ref<string[][]>([]);
	const columnRoles = ref<string[]>([]);
	const isDragOver = ref<boolean>(false);
	const showModal = ref<boolean>(false);
	const startLine = ref<number>(1);
	const successMessage = 'We Got it. Nice.';

	const props = defineProps<{
		mssg: string;
		DBname: string;
		componentName: string;
		disabled: boolean;
	}>();

	const statusMessage = ref('Drag file here or click.');

	const displayMessage = computed(() => {
		if (DBstore.isComponentDisabled(props.componentName)) {
			return props.componentName;
		}
		return props.disabled ? successMessage : props.mssg;
	});

	const getStoreNameFromDBstore = computed(() => {
		console.log(
			'storeName',
			DBstore.getStoreNameByComponent(props.componentName)
		);
		return DBstore.getStoreNameByComponent(props.componentName);
	});

	// watch([localDBloading, localDBloaded, () => props.mssg], () => {
	// 	if (localDBloading.value) {
	// 		statusMessage.value = 'Working on it...';
	// 	} else if (localDBloaded.value) {
	// 		statusMessage.value = 'Success!';
	// 	} else {
	// 		statusMessage.value = props.mssg;
	// 	}
	// });

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

	async function removeFromDB() {
		let storeName = DBstore.getStoreNameByComponent(
			props.componentName
		);
		await deleteObjectStore(props.DBname, storeName);
		resetModalState();
	}

	function resetModalState() {
		file.value = null;
		fileInput.value = null;
		columns.value = [];
		previewData.value = [];
		columnRoles.value = [];
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
		if (!DBstore.globalFileIsUploading) {
			isDragOver.value = false;
		}
	}

	function onDragEnter(event: DragEvent) {
		if (!DBstore.globalFileIsUploading) {
			isDragOver.value = true;
		}
	}

	function onDragLeave(event: DragEvent) {
		if (!DBstore.globalFileIsUploading) {
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
		const input = fileInput.value;
		if (input) {
			input.value = '';
			input.click();
		}
	}

	async function parseCSVForFullProcessing() {
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
					file.value.name,
					props.componentName
				);
			}
		} catch (error) {
			console.error('Error storing data in IndexedDB:', error);
		}
	}
</script>

<style scoped>
	.loaded {
		background-color: green;
	}
	.drop-zone {
		min-height: 150px;
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

	.pulse {
		background-color: #4caf50; /* Initial background color */
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% {
			background-color: #4caf50; /* Initial color */
		}
		50% {
			background-color: #81c784; /* Midpoint color */
		}
		100% {
			background-color: #4caf50; /* Initial color */
		}
	}
</style>

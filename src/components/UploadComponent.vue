<template>
	<div class="min-w-[300px] max-w-md rounded">
		<div
			class="px-6 rounded-lg shadow-md flex flex-col items-center justify-center space-y-4 h-96"
		>
			<UploadIcon class="w-8 h-8 text-primary" />
			<p class="text-muted-foreground">{{ displayMessage }}</p>
			<div
				:class="[
					'w-[95%] h-32 border-2 border-primary rounded-md flex items-center justify-center tracking-wide text-primary hover:bg-primary/80 transition-colors',
					{ pulse: localDBloading, fileLoaded: props.disabled },
				]"
				@dragover.prevent="onDragOver"
				@drop.prevent="onDrop"
				@dragenter="onDragEnter"
				@dragleave="onDragLeave"
				@click="selectFile"
			>
				<p :class="{ 'text-white': localDBloading }">
					{{ statusMessage }}
				</p>

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
			:columnRoleOptions="[
				{ value: 'destName', label: 'Destination' },
				{ value: 'dialCode', label: 'Dial Code' },
				{ value: 'rate', label: 'Rate' },
			]"
		/>
	</div>
	<!-- ::{{ localDBloading }} -->
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
	const { storeInIndexedDB, deleteObjectStore, localDBloading } =
		useIndexedDB();
	const file = ref<File | null>(null);
	const fileInput = ref<HTMLInputElement | null>(null);
	const columns = ref<string[]>([]);
	const previewData = ref<string[][]>([]);
	const columnRoles = ref<string[]>([]);
	const isDragOver = ref<boolean>(false);
	const showModal = ref<boolean>(false);
	const startLine = ref<number>(1);

	const statusMessage = ref<string>(
		'Drag file here or click to load.'
	);

	const props = defineProps<{
		mssg: string;
		DBname: string;
		componentName: string;
		disabled: boolean;
	}>();

	const displayMessage = ref(props.mssg);

	watch(
		[localDBloading, () => props.disabled],
		([localDBloadingVal, disabledVal]) => {
			if (localDBloadingVal) {
				statusMessage.value = 'Working on it...';
			} else if (disabledVal) {
				statusMessage.value = 'Success!';
			}
		}
	);

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
		resetLocalState();
		await deleteObjectStore(props.DBname, storeName);
	}

	function resetLocalState() {
		file.value = null;
		fileInput.value = null;
		columns.value = [];
		previewData.value = [];
		columnRoles.value = [];
		statusMessage.value = 'Drag file here or click to load.';
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

	function confirmColumnRoles(event: {
		columnRoles: string[];
		startLine: number;
	}) {
		showModal.value = false;
		console.log('column roles ', columnRoles);
		columnRoles.value = event.columnRoles;
		startLine.value = event.startLine;
		parseCSVForFullProcessing();
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
				delimiter: ',', // Specify the delimiter (default is auto-detect)
				quoteChar: '"', // Specify the quote character
				escapeChar: '\\', // Specify the escape character (optional)
				complete(results: Papa.ParseResult<string[]>) {
					const dataStartIndex = startLine.value - 1;
					const fullData = results.data.slice(dataStartIndex);
					const standardizedData: StandardizedData[] = [];

					fullData.forEach((row: string[]) => {
						const standardizedRow: StandardizedData = {
							destName: '',
							dialCode: 0,
							rate: 0,
						};

						// Assuming columnRoles is correctly defined
						columnRoles.value.forEach((role, index) => {
							if (role) {
								// Adjust index to skip empty roles
								const columnIndex = columnRoles.value.indexOf(role);

								switch (role) {
									case 'destName':
										standardizedRow.destName = row[columnIndex];
										break;
									case 'dialCode':
										standardizedRow.dialCode = parseFloat(
											row[columnIndex]
										);
										break;
									case 'rate':
										standardizedRow.rate = parseFloat(
											row[columnIndex]
										);
										break;
									default:
										standardizedRow[role] = row[columnIndex];
								}
							}
						});

						standardizedData.push(standardizedRow);
					});

					storeDataInIndexedDB(standardizedData);
				},
			});
		}
	}

	async function storeDataInIndexedDB(data: StandardizedData[]) {
		try {
			if (file.value) {
				await storeInIndexedDB(
					data,
					props.DBname,
					file.value.name,
					props.componentName
				);
			}
		} catch (error) {
			console.error('Error storing data in IndexedDB:', error);
		}
	}

	function preprocessCSV(csvText: string): string {
		// Enclose every field in double quotes
		const lines = csvText.split('\n');
		const processedLines = lines.map((line) => {
			const columns = line.split(',');
			const quotedColumns = columns.map((col) => `"${col}"`);
			return quotedColumns.join(',');
		});

		return processedLines.join('\n');
	}

	// async function storeDataInIndexedDB(
	// 	data: { [key: string]: string | number }[]
	// ) {
	// 	try {
	// 		if (file.value) {
	// 			const standardizedData: StandardizedData[] = data.map(
	// 				(row) => ({
	// 					destName: row.Destination as string,
	// 					dialCode: Number(row.Code),
	// 					rate: Number(row.Rate),
	// 					// Add more properties as needed
	// 				})
	// 			);

	// 			await storeInIndexedDB(
	// 				standardizedData,
	// 				props.DBname,
	// 				file.value.name,
	// 				props.componentName
	// 			);
	// 		}
	// 	} catch (error) {
	// 		console.error('Error storing data in IndexedDB:', error);
	// 	}
	// }
</script>

<style scoped>
	.fileLoaded {
		background-color: #81c784;
		color: white;
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
		animation: pulse 1s infinite;
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

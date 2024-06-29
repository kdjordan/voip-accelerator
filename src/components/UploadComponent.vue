<template>
	<div>
		<!-- Drop zone for file upload -->
		<div
			class="drop-zone border-2 border-dashed border-gray-300 p-6 text-center cursor-pointer rounded hover:border-gray-500 transition relative"
			@dragover.prevent="onDragOver"
			@drop.prevent="onDrop"
			@dragenter="onDragEnter"
			@dragleave="onDragLeave"
			:disabled="DBstore.globalFileIsUploading"
			:class="{
				'border-gray-500': isDragOver,
				loaded: loaded,
				'no-hover': localDBloading || localDBloaded,
				'bg-green-100': localDBloaded,
				'cursor-not-allowed': DBstore.globalFileIsUploading,
			}"
			@click="selectFile"
		>
			<div v-if="!localDBloading" v-html="displayMessage"></div>
			<input
				type="file"
				@change="handleFileUpload"
				accept=".csv"
				hidden
				:disabled="DBstore.globalFileIsUploading"
				ref="fileInput"
			/>
			<!-- Progress overlay -->
			<div v-if="localDBloading" class="pulseOverlay">
				<div class="pulse">
					<h2>Working on it...</h2>
				</div>
			</div>
		</div>
		global :: {{ DBstore.globalFileIsUploading }}<br />
		local :: {{ localDBloading }}<br />

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
	import TheModal from './TheModal.vue';
	import { ref, computed } from 'vue';
	import Papa from 'papaparse';
	import { useIndexedDB } from '../composables/useIndexDB';
	import {
		type StandardizedData,
		type ParsedResults,
	} from '../../types/app-types';
	import { useDBstore } from '@/stores/db';

	const DBstore = useDBstore();
	const { storeInIndexedDB, localDBloading, localDBloaded } =
		useIndexedDB();

	const file = ref<File | null>(null);
	const fileInput = ref<HTMLInputElement | null>(null);
	const columns = ref<string[]>([]);
	const previewData = ref<string[][]>([]);
	const columnRoles = ref<string[]>([]);
	const isDragOver = ref<boolean>(false);
	const showModal = ref<boolean>(false);
	const startLine = ref<number>(1);
	const loaded = ref<boolean>(false);
	const successMessage = '<p>We Got it. Nice.</p>';

	const props = defineProps<{
		mssg: string;
		DBname: string;
		compName: string;
	}>();

	const emit = defineEmits(['fileProcessed']);

	const displayMessage = computed(() => {
		return localDBloaded.value ? successMessage : props.mssg;
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
		if (!DBstore.globalFileIsUploading) {
			const input = fileInput.value;
			if (input) {
				input.click();
			}
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
					file.value.name.split('.')[0]
				);
			}
		} catch (error) {
			console.error('Error storing data in IndexedDB:', error);
		}
		emit('fileProcessed', props.compName);
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

	.pulse {
		width: 100%;
		height: 100%;
		display: block;
		background-color: #4caf50; /* Initial background color */
		animation: pulse 2s infinite;
	}

	.pulseOverlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		background: rgba(255, 255, 255, 0.8);
		z-index: 10;
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

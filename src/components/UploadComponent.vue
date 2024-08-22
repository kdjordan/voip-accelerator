<template>
	<div
		class="rounded-lg"
	>
			<p class="mb-8 text-center uppercase text-accent">{{ displayMessage }}</p>
		<div
			class="px-6 rounded-lg shadow-xl flex flex-col items-center justify-between bg-background w-full py-8 gap-8"
		>
			<div 
				:class="[
					'border border-foreground rounded-md flex items-center justify-center tracking-wide text-primary transition-colors w-full',
					{
						'animate-pulse bg-success': DBstore.isComponentFileUploading(
							props.componentName
						),
						'bg-success text-background': props.disabled,
						'hover:bg-muted cursor-pointer': !props.disabled,
            'cursor-not-allowed': props.disabled || DBstore.globalFileIsUploading
					},
				]"
				@dragover.prevent="onDragOver"
				@drop.prevent="onDrop"
				@dragenter="onDragEnter"
				@dragleave="onDragLeave"
				@click="selectFile"
			>
				<div class="flex flex-col items-center gap-10 py-10 text-foreground ">
					<p
						:class="{
							'text-white': DBstore.isComponentFileUploading(
								props.componentName
							),
							'text-black uppercase': props.disabled
						}"
					>
						{{ statusMessage }}
					</p>

					<UploadIcon
						v-if="!props.disabled"
						class="w-8 h-8 text-primary"
					/>
				</div>

				<input
					type="file"
					@change="handleFileUpload"
					accept=".csv"
					hidden
					:disabled="props.disabled || DBstore.globalFileIsUploading"
					ref="fileInput"
				/>
			</div>
			<button
				v-if="props.disabled"
				@click="dumpFile"
				class="btn btn-destructive"
			>
				Remove
			</button>
		</div>
		<!-- Column Roles Modal -->
		<TheModal
			v-show="showModal"
			:showModal="showModal"
			:columns="columns"
			:previewData="previewData"
			:columnRoles="columnRoles"
			:startLine="startLine"
			@confirm="confirmColumnRoles"
			@cancel="cancelModal"
			:columnRoleOptions="columnRoleOptions"
		/>
	</div>
</template>

<script setup lang="ts">
	import TheModal from './TheModal.vue';
	import { AZColumnRole } from '../../types/app-types';
	import UploadIcon from './UploadIcon.vue';
	import { ref, watch } from 'vue';
	import useCSVProcessing from '../composables/useCsvFilesFunctions';
	import { useDBstate } from '@/stores/dbStore';

	// Component props
	const props = defineProps<{
		typeOfComponent: string;
		DBname: string;
		componentName: string;
		disabled: boolean;
		columnRoleOptions: { value: AZColumnRole; label: string }[];
	}>();

	// Extract functions and reactive properties from useCSVProcessing composable
	const {
		file,
		startLine,
		columnRoles,
		columns,
		DBname,
		showModal,
		previewData,
		componentName,
		parseCSVForFullProcessing,
		parseCSVForPreview,
		removeFromDB,
	} = useCSVProcessing();

	// Define reactive properties
	const fileInput = ref<HTMLInputElement | null>(null);
	const isDragOver = ref<boolean>(false);
	const statusMessage = ref<string>('Drag file or click to upload');
	const displayMessage = ref<string>('');

	// Set DB name and component name from props
	const DBstore = useDBstate();

	DBname.value = props.DBname;
	componentName.value = props.componentName;

	// Setup displayMessage based on componentType prop
	const updateDisplayMessage = (type: string) => {
		if (type === 'owner') {
			displayMessage.value = 'Upload YOUR rates as CSV';
		} else if (type === 'client') {
			displayMessage.value = 'Upload CARRIER rates as CSV';
		} else if (type === 'complete') {
			displayMessage.value = DBstore.getStoreNameByComponent(
				props.componentName
			);
		}
	};

	// Watch for changes in typeOfComponent prop
	watch(
		() => props.typeOfComponent,
		(newType) => {
			updateDisplayMessage(newType);
		},
		{ immediate: true }
	);

	// Watch for changes in fileUploading and disabled prop
	watch(
		[
			() => DBstore.isComponentFileUploading(props.componentName),
			() => props.disabled,
		],
		([localDBloadingVal, disabledVal]) => {
			if (localDBloadingVal) {
				statusMessage.value = 'Working on it...';
			} else if (disabledVal) {
				statusMessage.value = 'Success';
				updateDisplayMessage('complete');
			}
		}
	);

	// Ensure statusMessage and displayMessage are correct if this component has an uploaded file
	if (DBstore.getStoreNameByComponent(props.componentName)) {
		updateDisplayMessage('complete');
	}

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

	function dumpFile() {
		removeFromDB()
		resetLocalState()
	}

	function resetLocalState() {
		file.value = null;
		fileInput.value = null;
		columns.value = [];
		previewData.value = [];
		columnRoles.value = [];
		statusMessage.value = 'Drag file here or click to load.';
		updateDisplayMessage(props.typeOfComponent)
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
		if (!props.disabled) {
			isDragOver.value = true;
		}
	}

	function onDragEnter(event: DragEvent) {
		if (!props.disabled) {
			isDragOver.value = true;
		}
	}

	function onDragLeave(event: DragEvent) {
		isDragOver.value = false;
	}

	interface ColumnRolesEvent {
		columnRoles: string[];
		startLine: number;
	}

	async function confirmColumnRoles(event: ColumnRolesEvent) {
		showModal.value = false;
		columnRoles.value = event.columnRoles;
		startLine.value = event.startLine;
		await parseCSVForFullProcessing();
	}

	function cancelModal() {
		showModal.value = false;
	}

	function selectFile(): void {
		if (!props.disabled) {
			const input = fileInput.value;
			if (input) {
				input.value = '';
				input.click();
			}
		}
	}
</script>

<style scoped>
	.drop-zone .absolute {
		transition: width 0.3s ease-in-out;
	}
	.drop-zone.no-hover:hover {
		border-color: inherit; /* Disable hover effect */
		cursor: not-allowed; /* Optionally change the cursor to indicate disabled state */
	}
</style>
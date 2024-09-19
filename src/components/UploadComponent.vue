<template>
	<div class="flex flex-col h-full">
		<p class="mb-4 text-center uppercase text-accent">
			<span>UPLOAD </span>
			<span class="text-white">{{ highlightedWord }}</span>
			<span> RATES AS CSV</span>
		</p>
		<div class="flex-grow flex flex-col bg-background w-full rounded-lg shadow-xl p-6">
			<div 
				:class="[
					'flex-grow flex flex-col items-center justify-center w-full border border-foreground rounded-md tracking-wide text-primary transition-colors p-8',
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
				<div class="flex flex-col items-center gap-10 py-10 text-foreground">
					<p
						:class="{
							'text-white': DBstore.isComponentFileUploading(
								props.componentName
							),
								'text-black uppercase': props.disabled
						}"
					>
						{{ props.disabled ? 'SUCCESS' : statusMessage }}
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
			<div class="h-12 mt-4 flex items-center justify-center">
				<button
					v-if="props.disabled"
					@click="dumpFile"
					class="btn btn-destructive"
				>
					Remove
				</button>
			</div>
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
	import { ColumnRolesEvent } from '../../types/app-types';
	import UploadIcon from './UploadIcon.vue';
	import { ref, watch, computed } from 'vue';
	import useCSVProcessing from '../composables/useCsvFiles';
	import { useDBstate } from '@/stores/dbStore';

	// Component props
	const props = defineProps<{
		typeOfComponent: string;
		DBname: string;
		componentName: string;
		disabled: boolean;
		columnRoleOptions: { value: string; label: string }[];
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
		deckType
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
	deckType.value = props.DBname
	
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
				updateDisplayMessage('complete');
			} else {
				statusMessage.value = 'Drag file or click to upload';
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



	async function confirmColumnRoles(event: ColumnRolesEvent) {
		showModal.value = false;
		columnRoles.value = event.columnRoles;
		startLine.value = event.startLine;
		deckType.value = event.deckType;
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

	const highlightedWord = computed(() => {
		return props.typeOfComponent === 'owner' ? 'YOUR' : 'CARRIER';
	});
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
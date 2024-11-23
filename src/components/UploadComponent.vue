<template>
	<div id="upload-component" class="flex flex-col w-full">
		<p v-if="!props.disabled"
			class="mb-4 text-center text-white"
		>
			UPLOAD {{ props.typeOfComponent === 'owner' ? 'YOUR' : 'CARRIER' }} RATES AS CSV
		</p>
		<div
			class="flex flex-col w-full"
		>
			<div
				:class="[
					'flex flex-col items-center justify-center border-dashed border border-white/30 rounded-lg transition-colors',
					{
						'animate-pulse bg-accent':
							DBstore.isComponentFileUploading(props.componentName),
						'bg-muted text-background': props.disabled,
						'hover:bg-white/5 cursor-pointer':
							!props.disabled && !isDragOver,
						'bg-white/5': isDragOver,
						'cursor-not-allowed':
							props.disabled || DBstore.globalFileIsUploading,
					},
				]"
				@dragover.prevent="onDragOver"
				@drop.prevent="onDrop"
				@dragenter.prevent="onDragEnter"
				@dragleave.prevent="onDragLeave"
				@click="selectFile"
			>
				<div
					class="flex items-center gap-4 py-4 text-foreground"
				>
					<p
						:class="{
							'text-white': DBstore.isComponentFileUploading(
								props.componentName
							),
							'text-black': props.disabled,
						}"
					>
						
							<div v-if="props.disabled"
								class="flex flex-col items-center  text-foreground p-4 rounded-lg shadow-md"
							>
								<div class="mb-2">{{ fileName }}</div>
							</div>
						
						<div v-else>
							{{ statusMessage }}
						</div>
					</p>

					<UploadIcon
						v-if="!props.disabled"
						class="w-4 h-4"
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
			<div class="py-4 text-center">
				<button
					v-if="props.disabled"
					@click="dumpFile"
					class="border border-white/20 hover:bg-muted/80 transition-all text-xl rounded-md px-2"
				>
				&times;
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
	import { ColumnRolesEvent, DBName } from '../../types/app-types';
	import UploadIcon from './UploadIcon.vue';
	import { ref, watch, computed } from 'vue';
	import useCSVProcessing from '../composables/useCsvFiles';
	import { useDBstate } from '@/stores/dbStore';

	// Component props
	const props = defineProps<{
		typeOfComponent: string;
		DBname: DBName;
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
		deckType,
		indetermRateType,
	} = useCSVProcessing();

	// Define reactive properties
	const fileInput = ref<HTMLInputElement | null>(null);
	const isDragOver = ref<boolean>(false);
	const statusMessage = ref<string>('Drag or Click to upload');
	const displayMessage = ref<string>('');
	// Set DB name and component name from props
	const DBstore = useDBstate();

	DBname.value = props.DBname;
	componentName.value = props.componentName;
	deckType.value = props.DBname;

	// Computed property to get the file name if the component is disabled
	const fileName = computed(() => {
		return props.disabled
			? DBstore.getStoreNameByComponent(props.componentName)
			: '';
	});

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
		removeFromDB();
		resetLocalState();
		DBstore.setAzReportsGenerated(false);
	}

	function resetLocalState() {
		file.value = null;
		fileInput.value = null;
		columns.value = [];
		previewData.value = [];
		columnRoles.value = [];
		statusMessage.value = 'Drag file here or click to load.';
		updateDisplayMessage(props.typeOfComponent);
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
		event.preventDefault();
		if (!props.disabled && !DBstore.globalFileIsUploading) {
			isDragOver.value = true;
		}
	}

	function onDragEnter(event: DragEvent) {
		event.preventDefault();
		if (!props.disabled && !DBstore.globalFileIsUploading) {
			isDragOver.value = true;
		}
	}

	function onDragLeave(event: DragEvent) {
		event.preventDefault();
		const rect = (
			event.target as HTMLElement
		).getBoundingClientRect();
		const x = event.clientX;
		const y = event.clientY;

		if (
			x <= rect.left ||
			x >= rect.right ||
			y <= rect.top ||
			y >= rect.bottom
		) {
			isDragOver.value = false;
		}
	}

	async function confirmColumnRoles(event: ColumnRolesEvent) {
		showModal.value = false;
		columnRoles.value = event.columnRoles;
		startLine.value = event.startLine;
		deckType.value = event.deckType;
		if (event.indetermRateType !== undefined) {
			indetermRateType.value = event.indetermRateType;
		}
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

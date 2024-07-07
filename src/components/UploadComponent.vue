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
					{ pulse: fileLoading.value, fileLoaded: props.disabled },
				]"
				@dragover.prevent="onDragOver"
				@drop.prevent="onDrop"
				@dragenter="onDragEnter"
				@dragleave="onDragLeave"
				@click="selectFile"
			>
				<p :class="{ 'text-white': fileLoading }">
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
	<!-- {{ DBstore.AZfilesUploaded.file1 }} -->
	{{ componentName }}
	{{ fileLoading.value }}
</template>

<script setup lang="ts">
	import TheModal from './TheModal.vue';
	import UploadIcon from './UploadIcon.vue';
	import DeleteButton from './DeleteButton.vue';
	import { ref, watch } from 'vue';
	import { useIndexedDB } from '../composables/useIndexDB';
	import useCSVProcessing from '../composables/useCsvFilesFunctions';
	import { useDBstore } from '@/stores/db';

	//componenet props
	const props = defineProps<{
		mssg: string;
		DBname: string;
		componentName: string;
		disabled: boolean;
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
		removeFromDB
	} = useCSVProcessing();

	// Define reactive properties
	const fileInput = ref<HTMLInputElement | null>(null);
	const isDragOver = ref<boolean>(false);
	const statusMessage = ref<string>(
		'Drag file here or click to load.'
	);
	const displayMessage = ref(props.mssg);

	// Set DB name and component name from props
	const DBstore = useDBstore();
	const { fileLoading } = useIndexedDB();

	DBname.value = props.DBname;
	componentName.value = props.componentName;


	watch(
		[() => fileLoading.value, () => props.disabled],
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

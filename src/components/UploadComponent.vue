<script setup lang="ts">
	import { ref } from 'vue';
	import Papa from 'papaparse';

	interface ParsedResults {
		data: string[][];
	}

	interface FileEmit {
		file: File;
		data: Array<{ [key: string]: string | number }>;
	}

	defineProps<{
		mssg: string;
	}>();

	const emit = defineEmits(['file-selected']);

	const file = ref<File | null>(null);
	const fileInput = ref<HTMLInputElement | null>(null);
	const columns = ref<string[]>([]);
	const previewData = ref<string[][]>([]);
	const columnRoles = ref<string[]>([]);
	const isDragOver = ref<boolean>(false);
	const showModal = ref<boolean>(false);
	const startLine = ref<number>(1);
	const loading = ref<boolean>(false);

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
		event.preventDefault();
	}

	function onDragEnter(event: DragEvent) {
		isDragOver.value = true;
	}

	function onDragLeave(event: DragEvent) {
		isDragOver.value = false;
	}

	function parseCSVForPreview(uploadedFile: File) {
		Papa.parse(uploadedFile, {
			header: false,
			complete(results: ParsedResults) {
				previewData.value = results.data.slice(0, 50); // Slice to get only the first 50 rows for preview
				columns.value = results.data[startLine.value - 1];
				columnRoles.value = Array(columns.value.length).fill('');
				showModal.value = true;
			},
		});
	}

	function parseCSVForFullProcessing() {
		console.log('parsing full');
		if (file.value) {
			Papa.parse(file.value, {
				header: false,
				skipEmptyLines: true,
				complete(results: ParsedResults) {
					const dataStartIndex = startLine.value - 1;
					const fullData = results.data.slice(dataStartIndex);
					const standardizedData = fullData.map((row) => {
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
						return standardizedRow;
					});

					emit('file-selected', {
						file: file.value,
						data: standardizedData,
					});
					showModal.value = false;
				},
			});
		}
	}

	function confirmColumnRoles() {
    parseCSVForFullProcessing()
		showModal.value = false;
	}

	function cancelModal() {
		showModal.value = false;
	}

	function selectFile(): void {
		const input = fileInput.value;
		if (input) {
			input.click();
		}
	}

</script>

<template>
	<div class="space-y-6">
		<!-- Drop zone for file upload -->
		<div
			class="drop-zone border-2 border-dashed border-gray-300 p-6 text-center cursor-pointer rounded hover:border-gray-500 transition"
			@dragover.prevent="onDragOver"
			@drop.prevent="onDrop"
			@dragenter="onDragEnter"
			@dragleave="onDragLeave"
			:class="{ 'border-gray-500': isDragOver }"
			@click="selectFile"
		>
			<div v-html="mssg"></div>
			<input
				type="file"
				@change="handleFileUpload"
				accept=".csv"
				hidden
				ref="fileInput"
			/>
		</div>

		<!-- Loading spinner -->
		<div v-if="loading" class="flex justify-center mt-4">
			<div
				class="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"
			></div>
		</div>

		<!-- Modal for column roles assignment -->
		<transition name="modal">
			<div
				v-if="showModal"
				class="fixed z-10 inset-0 overflow-y-auto"
			>
				<div
					class="flex items-center justify-center min-h-screen px-4 text-center"
				>
					<div
						class="fixed inset-0 transition-opacity"
						aria-hidden="true"
					>
						<div
							class="absolute inset-0 bg-gray-500 opacity-75"
						></div>
					</div>
					<span
						class="hidden sm:inline-block sm:align-middle sm:h-screen"
						aria-hidden="true"
						>&#8203;</span
					>
					<div
						class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6"
					>
						<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
							<div class="sm:flex sm:items-start">
								<div
									class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left"
								>
									<div class="flex items-center justify-between">
										<h3
											class="text-lg leading-6 font-medium text-gray-900"
											id="modal-title"
										>
											Select Column Roles
										</h3>
										<!-- Column role selection UI -->
										<div>
											<label
												for="start-line"
												class="block text-sm font-medium text-gray-700"
												>Data starts on line:</label
											>
											<select
												id="start-line"
												v-model="startLine"
												class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
											>
												<option v-for="i in 10" :key="i" :value="i">
													{{ i }}
												</option>
											</select>
										</div>
									</div>
									<!-- Preview of CSV data -->
									<div class="mt-2 overflow-auto max-h-80">
										<table class="min-w-full bg-white">
											<thead>
												<tr>
													<th
														class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
													>
														Row
													</th>
													<!-- Columns headers -->
													<th
														v-for="(col, index) in columns"
														:key="index"
														class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
													>
														<!-- Column role selection dropdown -->
														<select
															v-model="columnRoles[index]"
															class="block w-full border border-gray-300 rounded p-2"
														>
															<option value="">Select Role</option>
															<option value="destName">Name</option>
															<option value="dialCode">
																Dial Code
															</option>
															<option value="rate">Rate</option>
															<!-- Add more options as needed -->
														</select>
													</th>
												</tr>
											</thead>
											<tbody
												class="bg-white divide-y divide-gray-200"
											>
												<!-- Preview rows of CSV data -->
												<tr
													v-for="(row, rowIndex) in previewData"
													:key="rowIndex"
												>
													<td class="border px-4 py-2">
														{{ rowIndex + 1 }}
													</td>
													<!-- Display each cell in the row -->
													<td
														v-for="(cell, cellIndex) in row"
														:key="cellIndex"
														class="px-6 py-4 whitespace-nowrap"
													>
														{{ cell }}
													</td>
												</tr>
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>
						<!-- Modal footer with action buttons -->
						<div
							class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
						>
							<button
								@click="confirmColumnRoles"
								type="button"
								class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
							>
								Confirm
							</button>
							<button
								@click="cancelModal"
								type="button"
								class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			</div>
		</transition>
	</div>
</template>

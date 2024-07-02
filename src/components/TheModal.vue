<!-- ColumnRolesModal.vue -->
<template>
	<transition name="modal">
		<div v-if="showModal" class="fixed z-10 inset-0 overflow-y-auto">
			<div
				class="flex items-center justify-center min-h-screen px-4 text-center w-full"
			>
				<div
					class="fixed inset-0 transition-opacity"
					aria-hidden="true"
				>
					<div class="absolute inset-0 bg-gray-500 opacity-75"></div>
				</div>
				<span
					class="hidden sm:inline-block sm:align-middle sm:h-screen"
					aria-hidden="true"
					>&#8203;</span
				>
				<div
					class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full sm:p-6"
				>
					<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
						<div class="sm:flex sm:items-start">
							<div
								class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full"
							>
								<div class="flex items-center justify-between">
									<h3
										class="text-lg leading-6 font-medium text-gray-900"
										id="modal-title"
									>
										Select Column Roles
									</h3>
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
								<div class="mt-2 overflow-auto max-h-80">
									<table class="min-w-full bg-white">
										<thead>
											<tr>
												<th
													class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Row
												</th>
												<th
													v-for="(col, index) in columns"
													:key="index"
													class="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													<select
														v-model="columnRoles[index]"
														:class="{
															'bg-green-100':
																columnRoles[index] !== '',
														}"
														class="block w-full border border-gray-300 rounded p-2"
													>
														<option value="">Select Role</option>
														<option
															v-for="role in availableRoles(index)"
															:key="role"
															:value="role"
														>
															{{ role }}
														</option>
													</select>
												</th>
											</tr>
										</thead>
										<tbody class="bg-white divide-y divide-gray-200">
											<tr
												v-for="(row, rowIndex) in displayedData"
												:key="rowIndex"
											>
												<td class="border px-4 py-2">
													{{ rowIndex + 1 }}
												</td>
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
					<div
						class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
					>
						<button
							@click="confirmColumnRoles"
							:disabled="!allRequiredRolesSelected"
							:class="{
								'opacity-50 cursor-not-allowed':
									!allRequiredRolesSelected,
							}"
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
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue';

	const props = defineProps<{
		showModal: boolean;
		columns: string[];
		previewData: string[][];
		columnRoles: string[];
		startLine: number;
	}>();

	const emit = defineEmits(['confirm', 'cancel']);

	const startLine = ref(props.startLine);
	const columnRoles = ref([...props.columnRoles]);

	// Compute available roles for each column
	const availableRoles = (currentIndex: number) => {
		const usedRoles = new Set(
			columnRoles.value.filter(
				(role) => role !== '' && role !== undefined
			)
		);
		const allRoles = ['Destination', 'Code', 'Rate']; // Example roles; replace with your actual roles
		return allRoles.filter(
			(role) =>
				!usedRoles.has(role) ||
				role === columnRoles.value[currentIndex]
		);
	};

	const displayedData = computed(() => {
		return props.previewData.slice(startLine.value - 1);
	});

	// Check if all column roles are selected
	const allRequiredRolesSelected = computed(() => {
		const requiredRoles = ['Destination', 'Code', 'Rate'];
		return requiredRoles.every((role) =>
			columnRoles.value.includes(role)
		);
	});

	function confirmColumnRoles() {
		console.log(
			'sending in emit',
			columnRoles.value,
			startLine.value
		);
		emit('confirm', {
			columnRoles: columnRoles.value,
			startLine: startLine.value,
		});
	}

	function cancelModal() {
		emit('cancel');
	}
</script>

<style scoped>
	.aborder {
		border: 1px solid red;
	}
</style>

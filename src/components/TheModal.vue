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
					class="inline-block align-bottom rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full sm:p-6 bg-background"
				>
					<div
						class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 rounded-xl border border-gray-500"
					>
						<div class="sm:flex sm:items-start">
							<div
								class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full"
							>
								<div class="flex items-center justify-between">
									<h3
										class="text-lg leading-6 font-medium text-muted-foreground"
										id="modal-title"
									>
										Select Column Roles
									</h3>
									<div>
										<label
											for="start-line"
											class="block text-sm font-medium text-muted-foreground"
											>Data starts on line:</label
										>
										<select
											id="start-line"
											v-model="startLine"
											class="mt-1 block w-full bg-foreground text-stone-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
										>
											<option v-for="i in 10" :key="i" :value="i">
												{{ i }}
											</option>
										</select>
									</div>
								</div>
								<div class="mt-2 overflow-auto max-h-80">
									<table
										class="min-w-full rounded-lg overflow-hidden"
									>
										<thead class="bg-muted">
											<tr>
												<th
													class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
												>
													Row
												</th>
												<th
													v-for="(col, index) in columns"
													:key="index"
													class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
												>
													<select
														v-model="columnRoles[index]"
														:class="{
															'bg-accent text-background':
																columnRoles[index] !== '',
															'bg-foreground text-stone-700':
																columnRoles[index] === '',
														}"
														class="block w-full rounded min-w-[200px] transition-colors duration-200 px-3 py-2"
														>
													
														<option value="">
															Select Column Role
														</option>
														<option
															v-for="role in availableRoles(index)"
															:key="role.value"
															:value="role.value"
														>
															{{ role.label }}
														</option>
													</select>
												</th>
											</tr>
										</thead>
										<tbody>
											<tr
												v-for="(row, rowIndex) in displayedData"
												:key="rowIndex"
											>
												<td class="px-4 py-2">
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
					<div class="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
						<button
							@click="confirmColumnRoles"
							:disabled="!allRequiredRolesSelected"
							:class="{
								'opacity-50 cursor-not-allowed':
									!allRequiredRolesSelected,
							}"
							type="button"
							class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 btn btn-primary font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
						>
							Confirm
						</button>
						<button
							@click="cancelModal"
							type="button"
							class="mt-3 w-full inline-flex justify-center btn btn-destructive focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
	import { ref, computed, watch } from 'vue';

	const props = defineProps<{
		showModal: boolean;
		columns: string[];
		previewData: string[][];
		columnRoles: string[];
		startLine: number;
		columnRoleOptions: { value: string; label: string }[];
	}>();

	const emit = defineEmits(['confirm', 'cancel']);

	const startLine = ref(props.startLine);

	// Initialize columnRoles based on the number of columns, if not already initialized
	const columnRoles = ref(
		props.columnRoles.length > 0
			? [...props.columnRoles]
			: props.columns.map(() => '')
	);

	// Watch for changes in props.columnRoles to update local state if necessary
	watch(
		() => props.columnRoles,
		(newRoles) => {
			columnRoles.value =
				newRoles.length > 0
					? [...newRoles]
					: props.columns.map(() => '');
		},
		{ immediate: true }
	);

	const isNPANXXDeck = computed(() => {
		return props.columnRoleOptions.some(role => 
			['NPA', 'NXX', 'NPANXX', 'inter', 'intra', 'indeterm'].includes(role.value)
		);
	});

	const availableRoles = (currentIndex: number) => {
		const usedRoles = new Set(
			columnRoles.value.filter(role => role !== '' && role !== undefined)
		);

		return props.columnRoleOptions.filter(role => {
			if (isNPANXXDeck.value) {
				const hasNPANXX = usedRoles.has('NPANXX');
				if (hasNPANXX && (role.value === 'NPA' || role.value === 'NXX')) return false;
				if ((usedRoles.has('NPA') || usedRoles.has('NXX')) && role.value === 'NPANXX') return false;
			}
			return !usedRoles.has(role.value) || role.value === columnRoles.value[currentIndex];
		});
	};

	const displayedData = computed(() => {
		return props.previewData.slice(startLine.value - 1);
	});

	// Check if all required roles are selected
	const allRequiredRolesSelected = computed(() => {
		const selectedRoles = new Set(columnRoles.value.filter(role => role !== ''));
		
		if (isNPANXXDeck.value) {
			const hasNPANXX = selectedRoles.has('NPANXX');
			const hasNPAandNXX = selectedRoles.has('NPA') && selectedRoles.has('NXX');
			const hasRates = selectedRoles.has('inter') && selectedRoles.has('intra') && selectedRoles.has('indeterm');
			
			return (hasNPANXX || hasNPAandNXX) && hasRates;
		} else {
			// For AZ deck
			return props.columnRoleOptions.every(option => selectedRoles.has(option.value));
		}
	});

	function confirmColumnRoles() {
		emit('confirm', {
			columnRoles: columnRoles.value,
			startLine: startLine.value,
			deckType: isNPANXXDeck.value ? 'us' : 'az',
		});
	}

	function cancelModal() {
		emit('cancel');
	}
</script>

<style>
	tbody tr:nth-child(even) {
		background-color: hsl(220, 20%, 20%); /* Darker color for even rows */
	}
</style>
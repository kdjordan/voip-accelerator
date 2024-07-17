<template>
	<div class="bg-background rounded min-w-[950px] m-auto w-full p-6">
		<h2 class="text-center text-sizeXl uppercase pb-4 font-primary">
			Report
		</h2>

		<div>
			<h3 class="pb-4 uppercase">
				<span class="text-accent">{{ report.fileName1 }}</span> ::
				should buy these destinations from ::
				<span class="text-accent">{{ report.fileName2 }}</span>
			</h3>
			<table>
				<thead>
					<tr>
						<th>Dial Code(s)</th>
						<th>Destination</th>
						<th>{{ report.fileName1 }} Rate</th>
						<th>{{ report.fileName2 }} Rate</th>
						<th>Difference (%)</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="(item, dialCode) in report.higherRatesForFile1"
						:key="dialCode"
					>
						<td>{{ item.dialCode }}</td>
						<td>{{ item.destName }}</td>
						<td>{{ item.rateFile1 }}</td>
						<td>{{ item.rateFile2 }}</td>
						<td>{{ item.percentageDifference.toFixed(2) }}</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div>
			<h3 class="pb-4 uppercase">
				<span class="text-accent">{{ report.fileName1 }}</span> ::
				should sell these destinations to ::
				<span class="text-accent">{{ report.fileName2 }}</span>
			</h3>
			<table>
				<thead>
					<tr>
						<th>Dial Code(s)</th>
						<th>Destination</th>
						<th>{{ report.fileName1 }} - rate</th>
						<th>{{ report.fileName2 }} - rate</th>
						<th>Difference (%)</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="(item, dialCode) in report.higherRatesForFile2"
						:key="dialCode"
					>
						<td class="dialcodecell">{{ item.dialCode }}</td>
						<td>{{ item.destName }}</td>
						<td>{{ item.rateFile1 }}</td>
						<td>{{ item.rateFile2 }}</td>
						<td>{{ item.percentageDifference.toFixed(2) }}</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div>
			<h3 class="pb-4 uppercase">Same Rates</h3>
			<table>
				<thead>
					<tr>
						<th>Dial Code(s)</th>
						<th>Destination</th>
						<th>{{ report.fileName1 }} Rate</th>
						<th>{{ report.fileName2 }} Rate</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="(item, dialCode) in report.sameRates"
						:key="dialCode"
					>
						<td class="dialcodecell">{{ item.dialCode }}</td>
						<td>{{ item.destName }}</td>
						<td>{{ item.rateFile1 }}</td>
						<td>{{ item.rateFile2 }}</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div>
			<div class="flex align-center">
				<h3 class="pb-4 uppercase">Non-Matching Codes</h3>
				<div>
					<button
						@click="toggleUnmatchedCodes"
						class="ml-4 py-2 px-4 rounded transition text-center bg-blue-500 hover:bg-blue-600 text-white"
					>
						{{ buttonText }}
					</button>
				</div>
			</div>
			<table v-if="showUnmatchedCodes">
				<thead>
					<tr>
						<th>Dial Code</th>
						<th>Destination</th>
						<th>Rate</th>
						<th>Missing</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="(item, index) in report.nonMatchingCodes"
						:key="index"
					>
						<td class="dialcodecell">{{ item.dialCode }}</td>
						<td>{{ item.destName }}</td>
						<td>{{ item.rate }}</td>
						<td>{{ item.file }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { type ComparisonReport } from '../../types/app-types';
	import { ref, computed } from 'vue';

	const showUnmatchedCodes = ref<boolean>(false);

	defineProps<{
		report: ComparisonReport;
	}>();

	function toggleUnmatchedCodes() {
		showUnmatchedCodes.value = !showUnmatchedCodes.value;
	}

	const buttonText = computed(() => {
		return showUnmatchedCodes.value
			? 'Hide Unmatched Codes'
			: 'Show Unmatched Codes';
	});
</script>

<style scoped>
	.dialcodecell {
		max-width: 150px; /* Adjust the max-width as needed */
		word-wrap: break-word;
		white-space: normal;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 20px;
    line-height: 1.2;
	}

	th,
	td {
		border: 1px solid #ddd;
		padding: 8px; 
			text-align: left;
	}

	th {
		background-color: #f2f2f2;
	}
</style>

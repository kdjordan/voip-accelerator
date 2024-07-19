<template>
	<div
		class="bg-background rounded-lg m-auto  p-6 border"
	>
		<h2 class="text-center text-sizeXl uppercase pb-4 font-primary">
			Report
		</h2>

		<div>
			<h3 class="pb-4 text-sizeBase tracking-wider">
				<span class="text-foreground  uppercase">{{
					report.fileName1
				}}</span>
				:: should buy these destinations from ::
				<span class="text-foreground uppercase">{{
					report.fileName2
				}}</span>
			</h3>
			<table>
				<thead>
					<tr>
						<th>Dial Code(s)</th>
						<th>Destination</th>
						<th>Rate - {{ report.fileName1 }}</th>
						<th>Rate - {{ report.fileName2 }}</th>
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
			<h3 class="pb-4 text-sizeBase tracking-wider">
				<span class="text-foreground uppercase">{{ report.fileName1 }}</span> ::
				should sell these destinations to ::
				<span class="text-foreground uppercase">{{ report.fileName2 }}</span>
			</h3>
			<table>
				<thead>
					<tr>
						<th>Dial Code(s)</th>
						<th>Destination</th>
						<th>Rate - {{ report.fileName1 }}</th>
						<th>Rate - {{ report.fileName2 }}</th>
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
			<h3 class="pb-4 uppercase tracking-wider text-foreground text-sizeBase">Same Rates</h3>
			<table>
				<thead>
					<tr>
						<th>Dial Code(s)</th>
						<th>Destination</th>
						<th>Rate - {{ report.fileName1 }}</th>
						<th>Rate - {{ report.fileName2 }}</th>
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
			<div class="flex flex-col align-center gap-4">
				<h3 class="pb-4 uppercase tracking-wider text-foreground text-sizeBase">UnMatched Codes</h3>
				<div>
					<button
						@click="toggleUnmatchedCodes"
						class="btn btn-primary"
					>
						{{ buttonText }}
					</button>
				</div>
			</div>
			<table v-if="showUnmatchedCodes">
				<thead>
					<tr>
						<th>Dial Code</th>
						<th>Destination</th>e
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

<style>
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
		background-color: hsl(216, 14%, 34%);
	}

	th,
	td {
		border: 1px solid #ddd;
		padding: 8px;
		text-align: left;
	}

	
	th {
		/* background-color: #f2f2f2; */
		background-color: hsl(220, 30%, 10%);
		color: white;
	}
</style>

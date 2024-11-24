<template>
	<div class="rounded-lg p-6 min-w-content">
		<div v-if="report" class="space-y-8">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div
					v-for="file in fileKeys"
					:key="file"
					class="rounded-lg overflow-hidden border border-fbBorder"
				>
					<h2
						class="py-3 text-xl text-center text-fbWhite px-6 border-b border-fbBorder"
					>
						<span class="text-fbWhite ">{{
							getFileName(file)
						}}</span>
					</h2>
					<div class="p-6">
						<table class="w-full">
							<tbody>
								<tr class="border-b border-gray-700">
									<td class="py-2  text-gray-400">
										Total Codes:
									</td>
									<td class="py-2 text-right text-fbWhite">
										{{ getTotalCodes(file) }}
									</td>
								</tr>
								<tr class="border-b border-gray-700">
									<td class="py-2  text-gray-400">
										Total Destinations:
									</td>
									<td class="py-2 text-right">
										{{ getTotalDestinations(file) }}
									</td>
								</tr>
								<tr>
									<td class="py-2 font-medium text-gray-400">
										Unique Destinations Percentage:
									</td>
									<td class="py-2 text-right">
										{{ getUniqueDestinationsPercentage(file) }}%
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div class="rounded-lg overflow-hidden border border-fbBorder">
				<h2
					class="py-3 text-xl text-center text-fbWhite px-6 border-b border-fbBorder"
				>
					<span class="text-fbWhite">Comparison</span>
				</h2>
				<div class="p-6">
					<table class="w-full">
						<tbody>
							<tr class="border-b border-gray-700">
								<td class="py-2 font-medium text-gray-400">
									Matched Codes:
								</td>
								<td class="py-2 text-right text-foreground">
									{{ report.matchedCodes }}
								</td>
							</tr>
							<tr class="border-b border-gray-700">
								<td class="py-2 font-medium text-gray-400">
									Non-Matched Codes:
								</td>
								<td class="py-2 text-right text-foreground">
									{{ report.nonMatchedCodes }}
								</td>
							</tr>
							<tr class="border-b border-gray-700">
								<td class="py-2 font-medium text-gray-400">
									Matched Codes Percentage:
								</td>
								<td class="py-2 text-right text-foreground">
									{{ report.matchedCodesPercentage.toFixed(2) }}%
								</td>
							</tr>
							<tr>
								<td class="py-2 font-medium text-gray-400">
									Non-Matched Codes Percentage:
								</td>
								<td class="py-2 text-right text-foreground">
									{{ report.nonMatchedCodesPercentage.toFixed(2) }}%
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<div v-else class="text-center text-xl text-muted-foreground">
			No code report data available.
		</div>
	</div>
</template>

<script setup lang="ts">
	import { type AzCodeReport } from '@/types/app-types';
	import { resetReportApi } from '@/API/api';
	import { useDBstate } from '@/stores/dbStore';

	const dbStore = useDBstate();

	const props = defineProps<{
		report: AzCodeReport | null;
	}>();

	const fileKeys = ['file1', 'file2'] as const;
	type FileKey = (typeof fileKeys)[number];

	function getFileName(file: FileKey): string {
		return props.report?.[file].fileName ?? '';
	}

	function getTotalCodes(file: FileKey): number {
		return props.report?.[file].totalCodes ?? 0;
	}

	function getTotalDestinations(file: FileKey): number {
		return props.report?.[file].totalDestinations ?? 0;
	}

	function getUniqueDestinationsPercentage(file: FileKey): string {
		return (
			props.report?.[file].uniqueDestinationsPercentage.toFixed(2) ??
			'0.00'
		);
	}

</script>
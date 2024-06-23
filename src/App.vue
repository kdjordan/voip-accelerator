<template>
	<TheHeader />
	<div class="container mx-auto p-6 space-y-6">
		<UploadComponent
			v-if="file1 === null"
			@file-selected="handleFile1"
		/>
		<UploadComponent
			v-if="file2 === null"
			@file-selected="handleFile2"
		/>
		<button
			v-if="filesReady"
			@click="compareFiles"
			class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
		>
			Compare Files
		</button>
		<CompareComponent
			v-if="filesReady"
			:file1="file1"
			:file2="file2"
		/>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue';
	import UploadComponent from './components/UploadComponent.vue';
	import CompareComponent from './components/CompareComponent.vue';
	import TheHeader from './components/TheHeader.vue';

	interface FileEmit {
		file: File;
		// dialCodeColumn: string;
		// rateColumn: string;
	}

	const file1 = ref<FileEmit | null>(null);
	const file2 = ref<FileEmit | null>(null);

	const filesReady = computed(
		() => file1.value !== null && file2.value !== null
	);

	function handleFile1(fileData: FileEmit) {
		console.log('hadling file 1', fileData);
		file1.value = fileData;
	}

	function handleFile2(fileData: FileEmit) {
		console.log('hadling file 2', fileData);
		file2.value = fileData;
	}

	function compareFiles() {
		console.log('file 1 in app is', file1);
		if (file1.value && file2.value) {
			// Add your comparison logic here using file1 and file2
			console.log('Comparing files', file1.value, file2.value);
		} else {
			alert('Please select both files');
		}
	}
</script>

<style>
	.container {
		max-width: 600px;
	}
</style>

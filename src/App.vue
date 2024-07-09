<template>
	<div id="app">
		<!-- Header Component -->
		<Header />

		<!-- Main Content Area where routed components will be displayed -->
		<router-view />
	</div>
</template>

<script setup>
	import Header from './components/TheHeader.vue';

	import { onMounted, onBeforeUnmount } from 'vue';
	import { deleteIndexedDBDatabases } from './utils/resetIndexDb.ts';

	const dbNames = ['az', 'us', 'can']; // List your database names here

	onMounted(() => {
		const handleBeforeUnload = () => {
			deleteIndexedDBDatabases(dbNames);
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		// Cleanup event listener when component is unmounted
		onBeforeUnmount(() => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		});
	});
</script>

<style>
	.aborder {
		border: 1px solid red;
	}
	.bg-background {
		background-color: #f9f9f9;
	}

	.text-primary {
		color: #0070f3;
	}

	.text-secondary {
		color: #ff4081;
	}

	.bg-card {
		background-color: #fff;
	}

	.bg-green-100 {
		background-color: #d4f1c6;
	}

	.bg-blue-500 {
		background-color: #0070f3;
	}

	.text-muted-foreground {
		color: #6b7280;
	}

	.border-primary {
		border-color: #0070f3;
	}

	.border-secondary {
		border-color: #ff4081;
	}

	.hover\:bg-blue-600:hover {
		background-color: #005bb5;
	}
</style>

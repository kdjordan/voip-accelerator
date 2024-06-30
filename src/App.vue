<template>
	<div id="app">
		<!-- Header Component -->
		<Header />

		<!-- Main Content Area where routed components will be displayed -->
		<router-view />
	</div>
</template>

<script setup>
	import Header from './components/TheHeader.vue'
</script>
<style>
.aborder {
	border: 1px solid red;
}
</style>
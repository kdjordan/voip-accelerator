<template>
	<div id="app">
		<!-- Header Component -->
		<Header />

		<!-- Main Content Area where routed components will be displayed -->
		<router-view />
	</div>
  <TheFooter />
</template>

<script setup>
	import Header from './components/TheHeader.vue';
  import TheFooter from './components/TheFooter.vue'
</script>

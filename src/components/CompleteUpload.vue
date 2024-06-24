<template>
	<div class="w-full h-full bg-primary p-6 rounded text-center text-stone-800">{{ mssg }} !</div>
</template>
<script setup lang="ts">
	defineProps({
		mssg: {
			type: String,
			required: true,
		},
	});
</script>

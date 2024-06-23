<template>
	<div class="w-full h-full bg-green-500">{{ mssg }}</div>
</template>
<script setup lang="ts">
	defineProps({
		mssg: {
			type: String,
			required: true,
		},
	});
</script>

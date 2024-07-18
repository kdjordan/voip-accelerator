<template>
	<div class="flex justify-center">
		<header
			class="w-3/4 bg-background text-foreground flex justify-between items-center py-2 px-4 rounded-xl my-2 border border-muted"
		>
			<h1 class="tracking-wider text-foreground">
				The Telecom Toolkit
			</h1>
			<div class="flex items-center space-x-4">
					<Button
						class="bg-foreground text-background"
					>
						My account
					</Button>
				<Button
					class="bg-destructive text-foreground"
				>
					Log out
				</Button>
			</div>
		</header>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue';
	import { Button } from '@/components/ui/button'

	const dropdownOpen = ref(false);
	const isDarkTheme = ref(false);

	function toggleDropdown() {
		dropdownOpen.value = !dropdownOpen.value;
	}

	function toggleTheme() {
		isDarkTheme.value = !isDarkTheme.value;
		if (isDarkTheme.value) {
			document.body.classList.add('dark');
		} else {
			document.body.classList.remove('dark');
		}
	}
</script>

<style scoped>
	/* You can add any additional styling here */
</style>

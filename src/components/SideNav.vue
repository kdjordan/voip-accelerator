<template>
	<nav
		:class="[
			'sidebar',
			{ collapsed: !isOpen },
			'bg-background border-r border-muted min-w-[200px] fixed top-0 left-0 bottom-0',
		]"
	>
		<h1 class="tracking-widest text-center text-sizeBase py-2">
			<div
				class="flex items-center align-middle text-sizeXl text-accent justify-around px-8 mb-0"
			>
				<span class="shimmer" style="animation-delay: 0s">V</span>
				<span class="shimmer" style="animation-delay: 1s">O</span>
				<span class="shimmer" style="animation-delay: 2s">I</span>
				<span class="shimmer" style="animation-delay: 3s">P</span>
			</div>
			<span class="text-mutedForeground block text-sizeBase"
				>ACCELERATOR</span
			>
		</h1>
    <div class="border-b border-gray-600"></div> <!-- Tailwind Divider -->
		<ul class="flex-grow">
			<li
				v-for="item in items"
				:key="item.name"
				class="hover:bg-muted hover:text-muted-foreground"
			>
				<RouterLink
					:to="item.to"
					class="flex items-center space-x-2 py-4 pl-4"
					active-class="bg-muted text-accent"
				>
					<component :is="item.icon" class="w-6 h-6" />
					<span v-if="isOpen">{{ item.name }}</span>
				</RouterLink>
			</li>
		</ul>
	</nav>
</template>

<script setup lang="ts">
	import { RouterLink } from 'vue-router';
	import { ref } from 'vue';
	import {
		DocumentCurrencyDollarIcon,
		BarsArrowDownIcon,
		PercentBadgeIcon,
	} from '@heroicons/vue/24/outline';

	const isOpen = ref(true);

	function toggleSidebar() {
		isOpen.value = !isOpen.value;
	}

	const items = ref([
		{
			name: 'AZ Pricing',
			to: '/azpricing',
			icon: DocumentCurrencyDollarIcon,
		},
		{
			name: 'US Pricing',
			to: '/uspricing',
			icon: DocumentCurrencyDollarIcon,
		},
		{
			name: 'AZ LCR',
			to: '/lcr',
			icon: BarsArrowDownIcon,
		},
		{
			name: 'US LCR',
			to: '/lcr',
			icon: BarsArrowDownIcon,
		},
		{
			name: 'Dispute Engine',
			to: '/disputes',
			icon: PercentBadgeIcon,
		},
	]);
</script>

<style scoped>
	.sidebar {
		display: flex;
		flex-direction: column;
		height: 100vh; /* Full height */
		transition: width 0.3s;
		overflow-y: auto;
		overflow-x: hidden;
		z-index: 10;
	}

	.shimmer {
		animation: shimmer 6s infinite;
	}

	@keyframes shimmer {
		0% {
			color: #00ffcc;
		}
		50% {
			color: #00b3b3;
		}
		100% {
			color: #00ffcc;
		}
	}
</style>
<template>
	<nav
		:class="[
			'sidebar',
			{ collapsed: !isOpen },
			'bg-background rounded-tr-xl rounded-br-xl border border-muted min-w-[200px]',
		]"
	>
		<div class="p-4 flex flex-col pt-10 relative">
			<h1 class="tracking-widest text-center text-sizeBase">
				Telecom Toolkit
			</h1>
		</div>
		<hr class="my-8 border border-gray-600 rounded w-[90%] m-auto" />
		<ul class="flex-grow">
		<li
			v-for="item in items"
			:key="item.name"
			class="pl-4 hover:bg-muted hover:text-muted-foreground"
		>
			<RouterLink
				:to="item.to"
				class="flex items-center space-x-2 py-2"
				active-class="active-link"
			>
				<component :is="item.icon" class="w-6 h-6" />
				<span v-if="isOpen">{{ item.name }}</span>
			</RouterLink>
		</li>
	</ul>
		<hr class="my-8 border border-gray-600 rounded w-[90%] m-auto" />
		<!-- User Profile Section -->
		<div class="profile-section p-4">
			<div class="flex flex-col items-center mb-4">
				<div
					class="w-12 h-12 rounded-full bg-primary text-foreground flex items-center justify-center mb-2"
				>
					<span
						class="flex items-center justify-center h-12 w-12 bg-gray-400 rounded-full text-xl font-bold text-white"
						>MG</span
					>
				</div>
				<h4 class="text-base text-foreground">Michael Gough</h4>
				<p class="text-sm text-gray-400">name@company.com</p>
			</div>

			<!-- Space Indicator -->
			<div class="flex justify-between items-center mb-2 text-sizeSm text-foreground">
				<span>70 of 150 GB remains</span>
			</div>
			<div class="w-full bg-gray-400 rounded-full h-2.5 mb-4">
				<div
					class="bg-accent h-2.5 rounded-full"
					style="width: 47%"
				></div>
			</div>
			<button
				class="btn btn-primary w-full my-4"
			>
				Upgrade to Pro
			</button>
			<button class="btn btn-destructive w-full">Logout</button>
		</div>
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
		width: 200px;
		transition: width 0.3s;
		overflow: hidden;
		border-radius: 0 1rem 1rem 0; /* Upper right and lower right corners rounded */
		min-height: 100vh; /* Ensures the sidebar height adjusts to the content */
		z-index: 10; /* Ensures the sidebar is above other content */
	}

	.active-link {
		background-color: hsl(220, 20%, 20%); 
		color: hsl(120, 100%, 40%);
	}
</style>
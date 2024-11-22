<template>
	<nav
		:class="[
			'sidebar',
			'bg-background border-r border-muted fixed top-0 left-0 bottom-0',
			isOpen ? 'w-[200px]' : 'w-[64px]'
		]"
	>
		<h1 class="text-center py-2">
			<div
				class="flex items-center text-accent px-4 mb-0"
			>
				<span class="text-sizeXl">V</span>
				<BoltIcon class="w-8 h-8 -ml-1" />
			</div>
		</h1>
		<ul class="flex-grow">
			<li
				v-for="item in items"
				:key="item.name"
				class="px-2 my-1"
			>
				<RouterLink
					:to="item.to"
					class="flex items-center py-2 px-3 rounded-md transition-colors hover:bg-muted/50 overflow-hidden"
					:class="[
						isOpen ? 'space-x-2' : 'justify-center',
						{ 'bg-muted/90': $route.path === item.to }
					]"
				>
					<component :is="item.icon" class="w-5 h-5 text-white flex-shrink-0" />
					<span 
						v-if="isOpen" 
						class="text-foreground whitespace-nowrap"
					>{{ item.name }}</span>
				</RouterLink>
			</li>
		</ul>
		<!-- Collapse Arrow -->
		<div class="px-2">
			<button
				@click="toggleSidebar"
				class="flex items-center py-2 px-3 rounded-md transition-all w-full"
				:class="[isOpen ? 'justify-end' : 'justify-center']"
			>
				<ChevronLeftIcon
					class="w-5 h-5 transition-transform"
					:class="{ 'rotate-180': !isOpen }"
				/>
			</button>
		</div>
		<!-- User Dropdown -->
		<div class="p-4 relative">
			<!-- Dropdown Menu -->
			<div
				v-if="dropdownOpen"
				class="absolute bottom-full left-0 right-0 mb-2 p-2 bg-background border border-muted rounded-md shadow-lg"
			>
				<div class="space-y-2">
					<button
						v-for="(item, index) in dropdownItems"
						:key="index"
						class="w-full text-left px-3 py-2 hover:bg-muted rounded-md flex items-center space-x-2"
					>
						<component :is="item.icon" class="w-5 h-5" />
						<span v-if="isOpen">{{ item.label }}</span>
					</button>
				</div>
			</div>

			<!-- User Button -->
			<button
				@click="toggleDropdown"
				class="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-all"
			>
				<div class="flex-shrink-0 w-8 h-8 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
				</div>
				<div v-if="isOpen" class="flex-grow text-left">
					<div class="text-sm font-medium">kdjordan</div>
					<div class="text-xs text-muted-foreground">Free</div>
				</div>
				<ChevronUpDownIcon 
					v-if="isOpen"
					class="w-4 h-4 text-muted-foreground" 
				/>
			</button>
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
		ChevronLeftIcon,
		ChevronUpDownIcon,
		BoltIcon,
	} from '@heroicons/vue/24/outline';

	const isOpen = ref(true);
	const dropdownOpen = ref(false);

	function toggleSidebar() {
		isOpen.value = !isOpen.value;
	}

	function toggleDropdown() {
		dropdownOpen.value = !dropdownOpen.value;
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

	const dropdownItems = ref([
		{
			label: 'Profile',
			icon: DocumentCurrencyDollarIcon,
		},
		{
			label: 'Settings',
			icon: BarsArrowDownIcon,
		},
		{
			label: 'Logout',
			icon: PercentBadgeIcon,
		},
	]);
</script>

<style scoped>
	.router-link-active-style {
		background-color: rgb(var(--muted) / 0.9);
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		height: 100vh;
		transition: width 0.3s;
		overflow-y: auto;
		overflow-x: hidden;
		z-index: 10;
	}
</style>
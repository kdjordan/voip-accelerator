<template>
	<nav class="w-full bg-background">
		<div class="w-full flex justify-between items-center h-[5rem] px-4 font-primary text-accent">
			<div>
				<h1 class="uppercase lg:text-sizeXl">Telecom Toolkit</h1>
			</div>
			<DumpBtn />
			<div class="ml-auto">
				<ul class="flex gap-8 whitespace-nowrap text-sizeSm uppercase">
					<li><router-link to="/azpricing">AZ Pricing Tool</router-link></li>
					<li><router-link to="/lcr">LCR Generator</router-link></li>
					<li><router-link to="/dispute">Dispute Resolution</router-link></li>
				</ul>
			</div>
		</div>
	</nav>
</template>
<script setup lang="ts">
import DumpBtn from './DumpDbButton.vue'
</script>

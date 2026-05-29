<template>
  <div data-theme="light" class="min-h-screen bg-canvas font-sans text-fg antialiased">
    <TheTicker :items="[]" />
    <main class="mx-auto max-w-[1180px] px-6 py-8 md:px-10">
      <header
        class="flex flex-wrap items-center justify-between gap-5 border-b-2 border-line-strong pb-5"
      >
        <RouterLink to="/" class="inline-flex items-center gap-3 text-fg no-underline">
          <span class="brand-chip"><BoltSolidIcon class="h-4 w-4" /></span>
          <span class="font-display text-sm font-semibold uppercase tracking-[0.04em]">
            VoIP Accelerator
          </span>
        </RouterLink>
        <nav
          class="flex flex-wrap items-center gap-5 font-display text-xs uppercase tracking-[0.06em]"
        >
          <RouterLink to="/features" class="text-accent no-underline">Features</RouterLink>
          <RouterLink to="/pricing" class="text-fg-dim no-underline hover:text-fg"
            >Pricing</RouterLink
          >
          <RouterLink to="/contact" class="text-fg-dim no-underline hover:text-fg"
            >Contact</RouterLink
          >
          <RouterLink to="/signup" class="border border-line-strong px-4 py-2 text-fg no-underline">
            Get started
          </RouterLink>
        </nav>
      </header>

      <section class="grid gap-10 border-b border-line py-16 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p class="eyebrow mb-4">A-Z comparison · US NPANXX · LERG enrichment</p>
          <h1
            class="m-0 max-w-[820px] font-display text-[clamp(42px,7vw,76px)] font-semibold leading-[0.95] tracking-[-0.04em]"
          >
            Everything you need to analyze carrier rate decks.
          </h1>
        </div>
        <p class="m-0 max-w-[440px] text-[17px] leading-[1.6] text-fg-dim">
          Compare carrier rate decks, enrich rows with LERG context, normalize messy files, and
          export client-ready reports. Analysis runs locally, so your rate decks never leave your
          machine.
        </p>
      </section>

      <section class="grid gap-0 border-b border-line-strong md:grid-cols-3">
        <article
          v-for="(feature, index) in features"
          :key="feature.title"
          class="px-6 py-8"
          :class="index < 2 ? 'border-b border-line md:border-b-0 md:border-r' : ''"
        >
          <component :is="feature.icon" class="mb-5 h-7 w-7 text-accent" />
          <h2 class="m-0 font-display text-2xl font-semibold tracking-[-0.02em]">
            {{ feature.title }}
          </h2>
          <p class="mt-3 text-sm leading-[1.6] text-fg-dim">{{ feature.body }}</p>
        </article>
      </section>

      <section class="grid gap-10 py-16 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p class="eyebrow mb-4">Local-first by design</p>
          <h2
            class="m-0 font-display text-[clamp(32px,5vw,52px)] font-semibold leading-none tracking-[-0.035em]"
          >
            Your rate decks never leave your machine.
          </h2>
        </div>
        <div class="grid gap-5 sm:grid-cols-2">
          <div v-for="item in specs" :key="item.label" class="border-l-2 border-accent pl-4">
            <h3 class="m-0 font-display text-sm uppercase tracking-[0.12em]">{{ item.label }}</h3>
            <p class="mt-2 text-sm leading-[1.6] text-fg-dim">{{ item.body }}</p>
          </div>
        </div>
      </section>
    </main>
    <TheFooter />
  </div>
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router';
  import {
    ArrowsRightLeftIcon,
    MapIcon,
    ArrowDownTrayIcon,
    TableCellsIcon,
  } from '@heroicons/vue/24/outline';
  import { BoltIcon as BoltSolidIcon } from '@heroicons/vue/24/solid';
  import TheFooter from '@/components/shared/TheFooter.vue';
  import TheTicker from '@/components/shared/TheTicker.vue';
  import { useMarketingSeo } from '@/composables/useMarketingSeo';

  useMarketingSeo({
    path: '/features',
    title: 'A-Z & US Rate Deck Comparison + LERG Enrichment',
    description:
      'Compare carrier rate decks, enrich with LERG, normalize any format, and export client-ready reports. Nothing leaves your machine.',
  });

  const features = [
    {
      icon: ArrowsRightLeftIcon,
      title: 'A-Z rate deck comparison',
      body: 'Compare supplier and customer decks side-by-side to find cheaper routes, missing coverage, and sell opportunities.',
    },
    {
      icon: MapIcon,
      title: 'LERG enrichment',
      body: 'Add OCN, LATA, rate center, state, and jurisdiction context to NPANXX rows before pricing decisions are made.',
    },
    {
      icon: ArrowDownTrayIcon,
      title: 'Report export',
      body: 'Export switch-ready decks, audit summaries, and comparison reports for pricing reviews and partner responses.',
    },
  ];

  const specs = [
    {
      label: 'Input formats',
      body: 'CSV and Excel rate sheets with messy carrier column layouts, effective dates, and jurisdiction-specific rates.',
    },
    {
      label: 'Pricing scope',
      body: 'US NPANXX analysis today, with dormant A-Z comparison code retained for future international workflows.',
    },
    {
      label: 'Accuracy checks',
      body: 'Designed around coverage gaps, overlapping codes, interstate, intrastate, and indeterminate rate handling.',
    },
    {
      label: 'Local processing',
      body: 'Parsing, comparison, pricing adjustments, and exports run in the browser without uploading rate files.',
    },
  ];
</script>

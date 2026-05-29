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
          <RouterLink to="/features" class="text-fg-dim no-underline hover:text-fg"
            >Features</RouterLink
          >
          <RouterLink to="/pricing" class="text-accent no-underline">Pricing</RouterLink>
          <RouterLink to="/contact" class="text-fg-dim no-underline hover:text-fg"
            >Contact</RouterLink
          >
          <RouterLink to="/signup" class="border border-line-strong px-4 py-2 text-fg no-underline">
            Get started
          </RouterLink>
        </nav>
      </header>

      <section class="grid gap-10 border-b border-line py-16 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p class="eyebrow mb-4">Transparent pricing</p>
          <h1
            class="m-0 font-display text-[clamp(42px,7vw,76px)] font-semibold leading-[0.95] tracking-[-0.04em]"
          >
            VOIP Accelerator pricing.
          </h1>
        </div>
        <div class="border-l-4 border-accent pl-6">
          <p class="m-0 text-[17px] leading-[1.6] text-fg-dim">
            Start with the free local-first analyzer. Team licensing and walkthroughs are available
            for operators that need shared workflows or onboarding help.
          </p>
        </div>
      </section>

      <section class="grid gap-6 py-12 md:grid-cols-2">
        <article class="border border-line-strong p-7">
          <p class="eyebrow mb-3">Self-serve</p>
          <h2 class="m-0 font-display text-3xl font-semibold tracking-[-0.025em]">Free forever</h2>
          <p class="mt-3 text-sm leading-[1.6] text-fg-dim">
            Upload your own rate deck, compare NPANXX coverage, enrich with LERG context, reprice,
            and export results. Files are processed locally.
          </p>
          <RouterLink
            to="/signup"
            class="mt-6 inline-flex bg-accent px-5 py-3 font-display text-xs font-semibold uppercase tracking-[0.06em] text-accent-ink no-underline"
          >
            Analyze your own deck
          </RouterLink>
        </article>

        <article class="border border-line-strong p-7">
          <p class="eyebrow mb-3">Teams</p>
          <h2 class="m-0 font-display text-3xl font-semibold tracking-[-0.025em]">Contact us</h2>
          <p class="mt-3 text-sm leading-[1.6] text-fg-dim">
            For multi-seat licensing, walkthroughs, or telecom-specific onboarding, talk to the team
            behind the product.
          </p>
          <RouterLink
            to="/contact"
            class="mt-6 inline-flex border border-line-strong px-5 py-3 font-display text-xs font-semibold uppercase tracking-[0.06em] text-fg no-underline"
          >
            Book a walkthrough
          </RouterLink>
        </article>
      </section>

      <section class="border-t border-line py-14">
        <p class="eyebrow mb-4">Data handling FAQ</p>
        <div class="grid gap-6 md:grid-cols-3">
          <div v-for="item in faq" :key="item.q">
            <h2 class="m-0 font-display text-xl font-semibold tracking-[-0.015em]">{{ item.q }}</h2>
            <p class="mt-3 text-sm leading-[1.6] text-fg-dim">{{ item.a }}</p>
          </div>
        </div>
      </section>
    </main>
    <TheFooter />
  </div>
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router';
  import { BoltIcon as BoltSolidIcon } from '@heroicons/vue/24/solid';
  import TheFooter from '@/components/shared/TheFooter.vue';
  import TheTicker from '@/components/shared/TheTicker.vue';
  import { useMarketingSeo } from '@/composables/useMarketingSeo';

  useMarketingSeo({
    path: '/pricing',
    title: 'Rate Deck Analysis Software Pricing - VOIP Accelerator',
    description:
      'Transparent pricing for local-first rate deck analysis. Try it on your own deck with no sales call and no deck uploads.',
  });

  const faq = [
    {
      q: 'Do my files upload to a server?',
      a: 'No. Rate deck parsing, analysis, pricing changes, and exports run locally in your browser.',
    },
    {
      q: 'Can I try it with real data?',
      a: 'Yes. The local-first workflow is designed so you can test with your own deck without sending carrier pricing to a cloud service.',
    },
    {
      q: 'When should I contact sales?',
      a: 'Contact us for team licensing, onboarding, or help mapping your existing rate deck workflow into VOIP Accelerator.',
    },
  ];
</script>

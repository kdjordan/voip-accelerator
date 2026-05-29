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
          <RouterLink to="/pricing" class="text-fg-dim no-underline hover:text-fg"
            >Pricing</RouterLink
          >
          <RouterLink to="/contact" class="text-accent no-underline">Contact</RouterLink>
          <RouterLink to="/signup" class="border border-line-strong px-4 py-2 text-fg no-underline">
            Get started
          </RouterLink>
        </nav>
      </header>

      <section class="grid gap-10 border-b border-line py-16 lg:grid-cols-[1fr_0.85fr]">
        <div>
          <p class="eyebrow mb-4">Contact & demo</p>
          <h1
            class="m-0 font-display text-[clamp(42px,7vw,76px)] font-semibold leading-[0.95] tracking-[-0.04em]"
          >
            Talk to us or book a demo.
          </h1>
        </div>
        <div class="border-l-4 border-accent pl-6">
          <p class="m-0 text-[17px] leading-[1.6] text-fg-dim">
            Ask about team licensing, walkthroughs, rate deck workflows, or telecom-specific
            onboarding. You can also start directly with your own local deck.
          </p>
        </div>
      </section>

      <section class="grid gap-8 py-14 md:grid-cols-2">
        <article class="border border-line-strong p-7">
          <EnvelopeIcon class="mb-5 h-7 w-7 text-accent" />
          <h2 class="m-0 font-display text-3xl font-semibold tracking-[-0.025em]">
            Email the team
          </h2>
          <p class="mt-3 text-sm leading-[1.6] text-fg-dim">
            Send a note about your carrier pricing workflow, deck formats, or team requirements.
          </p>
          <a
            href="mailto:support@voipaccelerator.com"
            class="mt-6 inline-flex bg-accent px-5 py-3 font-display text-xs font-semibold uppercase tracking-[0.06em] text-accent-ink no-underline"
          >
            support@voipaccelerator.com
          </a>
        </article>

        <article class="border border-line-strong p-7">
          <ArrowDownTrayIcon class="mb-5 h-7 w-7 text-accent" />
          <h2 class="m-0 font-display text-3xl font-semibold tracking-[-0.025em]">Try it first</h2>
          <p class="mt-3 text-sm leading-[1.6] text-fg-dim">
            The fastest way to evaluate fit is to analyze a real rate deck locally. Nothing leaves
            your machine.
          </p>
          <RouterLink
            to="/signup"
            class="mt-6 inline-flex border border-line-strong px-5 py-3 font-display text-xs font-semibold uppercase tracking-[0.06em] text-fg no-underline"
          >
            Start local analysis
          </RouterLink>
        </article>
      </section>
    </main>
    <TheFooter />
  </div>
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router';
  import { ArrowDownTrayIcon, EnvelopeIcon } from '@heroicons/vue/24/outline';
  import { BoltIcon as BoltSolidIcon } from '@heroicons/vue/24/solid';
  import TheFooter from '@/components/shared/TheFooter.vue';
  import TheTicker from '@/components/shared/TheTicker.vue';
  import { useMarketingSeo } from '@/composables/useMarketingSeo';

  useMarketingSeo({
    path: '/contact',
    title: 'Contact & Demo - VOIP Accelerator',
    description:
      'Talk to the team behind VOIP Accelerator about team licensing or book a walkthrough. Or analyze your own rate deck today.',
  });
</script>
